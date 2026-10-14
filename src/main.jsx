import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { firebaseConfigured, missingFirebaseEnv } from './firebase/config'

registerSW({ immediate: true })

const root = createRoot(document.getElementById('root'))

function SetupRequired() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 app-surface">
      <section className="card-soft w-full rounded-[30px] p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-700">UsVault</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--ink-title)]">Firebase is not configured</h1>
        <p className="mt-2 text-sm text-slate-600">
          Copy <code>.env.example</code> to <code>.env</code>, fill in your Firebase web app config
          (Firebase Console → Project settings → Your apps), then restart the dev server.
        </p>
        <p className="mt-3 text-xs font-semibold text-slate-500">Missing:</p>
        <ul className="mt-1 list-disc pl-5 text-xs text-rose-700">
          {missingFirebaseEnv.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}

async function boot() {
  if (!firebaseConfigured) {
    root.render(<SetupRequired />)
    return
  }

  // Loaded lazily so Firebase-dependent modules never run without config.
  const { default: App } = await import('./App.jsx')
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()
