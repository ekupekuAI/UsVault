const admin = require('firebase-admin')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { logger } = require('firebase-functions')

admin.initializeApp()

const db = admin.firestore()
const messaging = admin.messaging()

function normalizeString(value, max = 240) {
  return String(value || '').trim().slice(0, max)
}

function toDataValue(value, max = 512) {
  return normalizeString(value, max)
}

function buildWebpushMessage({ title, body, notificationId, targetUid, type, source, originUid }) {
  return {
    notification: {
      title,
      body,
    },
    data: {
      notificationId: toDataValue(notificationId, 128),
      targetUid: toDataValue(targetUid, 128),
      type: toDataValue(type, 64),
      source: toDataValue(source, 64),
      originUid: toDataValue(originUid, 128),
      click_action: '/',
    },
    webpush: {
      notification: {
        title,
        body,
        icon: '/pwa-192.svg',
        badge: '/pwa-192.svg',
      },
      fcmOptions: {
        link: '/',
      },
    },
  }
}

exports.sendPartnerPushOnNotification = onDocumentCreated(
  {
    document: 'users/{userId}/notifications/{notificationId}',
    region: 'asia-south1',
    retry: true,
  },
  async (event) => {
    const snapshot = event.data
    if (!snapshot) {
      return
    }

    const payload = snapshot.data() || {}
    const targetUid = normalizeString(event.params.userId, 128)
    const notificationId = normalizeString(event.params.notificationId, 128)
    const originUid = normalizeString(payload.originUid, 128)
    const title = normalizeString(payload.title, 80) || 'UsVault'
    const body = normalizeString(payload.body, 180) || 'New update from your partner.'
    const type = normalizeString(payload.type, 64) || 'info'
    const source = normalizeString(payload.source, 64)

    // Only push partner-originated updates to closed apps.
    if (!originUid || originUid === targetUid) {
      return
    }

    const tokenDoc = await db.doc(`push_tokens/${targetUid}`).get()
    const tokens = Array.isArray(tokenDoc.data()?.tokens)
      ? tokenDoc.data().tokens.filter((token) => typeof token === 'string' && token.trim())
      : []

    if (!tokens.length) {
      logger.info('No push tokens for user', { targetUid, notificationId })
      return
    }

    const baseMessage = buildWebpushMessage({
      title,
      body,
      notificationId,
      targetUid,
      type,
      source,
      originUid,
    })

    const response = await messaging.sendEachForMulticast({
      ...baseMessage,
      tokens,
    })

    const invalidTokens = []
    response.responses.forEach((item, index) => {
      if (item.success) {
        return
      }
      const code = item.error?.code || ''
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(tokens[index])
      }
    })

    if (invalidTokens.length) {
      await db.doc(`push_tokens/${targetUid}`).set(
        {
          tokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      )
    }

    logger.info('Push dispatch completed', {
      targetUid,
      notificationId,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })
  },
)
