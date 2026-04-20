import { useEffect, useState } from 'react'

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    function handleInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    function handleInstalled() {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function installApp() {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  if (!deferredPrompt || isInstalled) {
    return null
  }

  return (
    <div className="mx-4 mt-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-rose-50 px-3 py-2 text-xs text-violet-700 fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <p>Install UsVault for an app-like full-screen experience.</p>
        <button
          type="button"
          onClick={installApp}
          className="pressable rounded-full bg-violet-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-violet-500"
        >
          Install
        </button>
      </div>
    </div>
  )
}

export default InstallPrompt
