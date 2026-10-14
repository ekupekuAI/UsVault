import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// Runs against the Firestore emulator: `npm run test:rules`.
let env

const ALICE = 'alice-uid'
const BOB = 'bob-uid'
const MALLORY = 'mallory-uid'
const ADMIN_EMAIL = 'gekansh2008@gmail.com'
const BOB_CODE = 'UV-BOBCOD-E12345'
const DATE = '2026-10-14'

function as(uid, email = `${uid}@example.com`) {
  return env.authenticatedContext(uid, { email }).firestore()
}

async function seed(callback) {
  await env.withSecurityRulesDisabled(async (context) => {
    await callback(context.firestore())
  })
}

async function linkAliceAndBob() {
  await seed(async (db) => {
    await updateDoc(doc(db, 'statuses', ALICE), { partnerUid: BOB })
    await updateDoc(doc(db, 'statuses', BOB), { partnerUid: ALICE })
  })
}

function profile(uid) {
  return { uid, email: `${uid}@example.com`, displayName: uid, partnerUid: '', gossipEntries: [], status: 'Free' }
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-usvault-rules',
    firestore: {
      rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'),
      host: '127.0.0.1',
      port: 62091,
    },
  })
})

afterAll(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await seed(async (db) => {
    await setDoc(doc(db, 'statuses', ALICE), profile(ALICE))
    await setDoc(doc(db, 'statuses', BOB), { ...profile(BOB), partnerCode: BOB_CODE })
    await setDoc(doc(db, 'statuses', MALLORY), profile(MALLORY))
    await setDoc(doc(db, 'partner_codes', BOB_CODE), { uid: BOB })
  })
})

describe('statuses privacy', () => {
  it('owner can read own profile', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), 'statuses', ALICE)))
  })

  it('strangers cannot read or list other profiles', async () => {
    await assertFails(getDoc(doc(as(MALLORY), 'statuses', ALICE)))
    await assertFails(getDocs(collection(as(MALLORY), 'statuses')))
  })

  it('mutually linked partners can read each other', async () => {
    await linkAliceAndBob()
    await assertSucceeds(getDoc(doc(as(ALICE), 'statuses', BOB)))
  })

  it('pointing at someone one-sidedly grants nothing', async () => {
    await seed(async (db) => {
      await updateDoc(doc(db, 'statuses', MALLORY), { partnerUid: ALICE })
    })
    await assertFails(getDoc(doc(as(MALLORY), 'statuses', ALICE)))
  })

  it('admin can list profiles', async () => {
    await assertSucceeds(getDocs(collection(as('admin-uid', ADMIN_EMAIL), 'statuses')))
  })
})

describe('partner linking', () => {
  function linkBatch(db, me, target, code, extra = {}) {
    const batch = writeBatch(db)
    batch.set(doc(db, 'statuses', me), { partnerUid: target, linkCode: code }, { merge: true })
    batch.update(doc(db, 'statuses', target), { partnerUid: me, ...extra })
    return batch.commit()
  }

  it('links both sides when the code is valid', async () => {
    await assertSucceeds(linkBatch(as(ALICE), ALICE, BOB, BOB_CODE))
  })

  it('rejects linking with a code that belongs to someone else', async () => {
    await assertFails(linkBatch(as(MALLORY), MALLORY, ALICE, BOB_CODE))
  })

  it('rejects stealing an already linked partner', async () => {
    await linkAliceAndBob()
    await assertFails(linkBatch(as(MALLORY), MALLORY, BOB, BOB_CODE))
  })

  it('rejects touching other fields of the partner profile', async () => {
    await assertFails(linkBatch(as(ALICE), ALICE, BOB, BOB_CODE, { displayName: 'hacked' }))
  })

  it('codes can be fetched one at a time but never listed', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), 'partner_codes', BOB_CODE)))
    await assertFails(getDocs(collection(as(ALICE), 'partner_codes')))
  })

  it('users cannot hijack or forge codes', async () => {
    await assertFails(setDoc(doc(as(MALLORY), 'partner_codes', BOB_CODE), { uid: MALLORY }))
    await assertFails(setDoc(doc(as(MALLORY), 'partner_codes', 'UV-FAKEBO-B00001'), { uid: BOB }))
    await assertSucceeds(setDoc(doc(as(MALLORY), 'partner_codes', 'UV-MALLOR-Y00001'), { uid: MALLORY }))
  })
})

describe('journal entries', () => {
  it('owner can save a partial entry (mood only)', async () => {
    await assertSucceeds(setDoc(doc(as(ALICE), 'users', ALICE, 'entries', DATE), { id: DATE, date: DATE, mood: 'x' }))
  })

  it('partner cannot read the journal', async () => {
    await linkAliceAndBob()
    await seed(async (db) => {
      await setDoc(doc(db, 'users', ALICE, 'entries', DATE), { id: DATE, date: DATE })
    })
    await assertFails(getDoc(doc(as(BOB), 'users', ALICE, 'entries', DATE)))
  })

  it('rejects oversized text', async () => {
    await assertFails(
      setDoc(doc(as(ALICE), 'users', ALICE, 'entries', DATE), { id: DATE, date: DATE, text: 'a'.repeat(2501) }),
    )
  })
})

describe('bans', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'user_controls', ALICE), { uid: ALICE, banned: true, canUseApp: false })
    })
  })

  it('banned users lose data access but can read their ban reason', async () => {
    await assertFails(setDoc(doc(as(ALICE), 'users', ALICE, 'entries', DATE), { id: DATE, date: DATE, text: 'hi' }))
    await assertFails(getDoc(doc(as(ALICE), 'statuses', ALICE)))
    await assertSucceeds(getDoc(doc(as(ALICE), 'user_controls', ALICE)))
  })

  it('users cannot unban themselves', async () => {
    await assertFails(setDoc(doc(as(ALICE), 'user_controls', ALICE), { uid: ALICE, banned: false, canUseApp: true }))
  })
})

describe('notifications', () => {
  const note = { title: 'Hi', body: 'Hello', type: 'info', source: '', originUid: '', originEmail: '', read: false }

  it("strangers cannot write into someone else's notifications", async () => {
    await assertFails(setDoc(doc(as(MALLORY), 'users', ALICE, 'notifications', 'n1'), { ...note, originUid: MALLORY }))
  })

  it('linked partners can notify each other', async () => {
    await linkAliceAndBob()
    await assertSucceeds(setDoc(doc(as(BOB), 'users', ALICE, 'notifications', 'n1'), { ...note, originUid: BOB }))
  })
})
