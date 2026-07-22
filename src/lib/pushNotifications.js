// Browser & Mobile PWA Web Push Notification Utility

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Web Notifications not supported in this browser.')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function sendSystemNotification({ title, body, icon = '/Wayfare_favicon.jpeg', url = '/chat' }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notification permission not granted.')
    return
  }

  try {
    // If ServiceWorker registration is available, use showNotification for mobile PWA
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200, 100, 200],
          data: { url },
          actions: [
            { action: 'open_chat', title: '💬 Open Chat' }
          ]
        })
      }).catch(() => {
        // Fallback to standard window Notification
        createWindowNotification(title, body, icon, url)
      })
    } else {
      createWindowNotification(title, body, icon, url)
    }
  } catch (err) {
    console.error('Error sending system notification:', err)
  }
}

function createWindowNotification(title, body, icon, url) {
  const notif = new Notification(title, {
    body,
    icon,
    badge: icon,
    tag: 'wayfare-booking-' + Date.now(),
    vibrate: [200, 100, 200]
  })

  notif.onclick = (e) => {
    e.preventDefault()
    window.focus()
    if (url) {
      window.location.href = url
    }
    notif.close()
  }
}
