// Gestionnaire des Notifications Navigateur (Web Push / Notification API)
// Permet d'avertir la gérante même si l'onglet est réduit ou en arrière-plan.

export const isBrowserNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNotificationPermission = async () => {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Erreur demande permission notification:', err);
    return 'denied';
  }
};

/**
 * Envoie une notification système native au PC / Smartphone
 */
export const sendSystemNotification = ({ title, body, icon, tag = 'salon-booking', onClick }) => {
  // 1. Vibration physique sur téléphone Android (3 pulsations vibrantes)
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate([300, 100, 300, 100, 400]);
    } catch (e) {
      // Ignorer si bloqué par les politiques de navigateur
    }
  }

  // 2. Notification Push Native
  if (!isBrowserNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(title, {
      body: body || 'Nouvelle activité sur votre salon',
      icon: icon || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=128&q=80',
      badge: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=96&q=80',
      tag: tag,
      requireInteraction: true, // Reste visible jusqu'à ce que la gérante clique ou ferme !
      silent: false
    });

    notification.onclick = () => {
      window.focus();
      if (onClick) onClick();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('Erreur envoi notification système:', err);
    return null;
  }
};
