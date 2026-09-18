import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playSoundPreset, playSuperLoudBookingAlert } from '../utils/soundEffects';
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendSystemNotification
} from '../utils/browserNotifications';
import { supabase } from '../lib/supabase';

const NotificationContext = createContext(null);

const STORAGE_KEYS = {
  NOTIFICATIONS: 'appointfy_notifications_history',
  SOUND_ENABLED: 'appointfy_sound_enabled',
  SOUND_VOLUME: 'appointfy_sound_volume',
  SOUND_PRESET: 'appointfy_sound_preset',
  VOICE_ENABLED: 'appointfy_voice_enabled'
};

export const NotificationProvider = ({ children }) => {
  // 1. Liste des notifications (historique)
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrer les anciens messages de test/bienvenue factices
        return parsed.filter(n => n.id !== 'welcome-notif');
      }
      return [];
    } catch {
      return [];
    }
  });

  // 2. Paramètres sonores (Par défaut: 100% LOUD)
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [soundVolume, setSoundVolumeState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME);
      return saved !== null ? Number(saved) : 1.5; // 1.5 = 150% Super Loud
    } catch {
      return 1.5;
    }
  });

  const [voiceEnabled, setVoiceEnabledState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOICE_ENABLED);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [soundPreset, setSoundPresetState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SOUND_PRESET) || 'cash';
    } catch {
      return 'cash';
    }
  });

  // 3. Statut Permission Push Navigateur
  const [pushPermission, setPushPermission] = useState(() => getNotificationPermission());

  // 4. Toast actif flottant (Niveau 1 visuel)
  const [activeToast, setActiveToast] = useState(null);

  // Synchronisation des paramètres vers Supabase
  const syncSettingsToSupabase = async (newConfig) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: mySalon } = await supabase
        .from('salons')
        .select('id, notification_settings')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (mySalon) {
        const salonId = mySalon.id;
        const current = mySalon.notification_settings || {};
        await supabase.from('salons').update({
          notification_settings: {
            ...current,
            ...newConfig
          }
        }).eq('id', salonId);
      }
    } catch (e) {
      console.warn('Supabase notification_settings sync fallback:', e);
    }
  };

  const setSoundEnabled = (val) => {
    setSoundEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, JSON.stringify(val));
    syncSettingsToSupabase({ sound_enabled: val });
  };

  const setSoundVolume = (val) => {
    setSoundVolumeState(val);
    localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(val));
    syncSettingsToSupabase({ sound_volume: val });
  };

  const setSoundPreset = (val) => {
    setSoundPresetState(val);
    localStorage.setItem(STORAGE_KEYS.SOUND_PRESET, val);
    syncSettingsToSupabase({ sound_preset: val });
  };

  const setVoiceEnabled = (val) => {
    setVoiceEnabledState(val);
    localStorage.setItem(STORAGE_KEYS.VOICE_ENABLED, JSON.stringify(val));
    syncSettingsToSupabase({ voice_enabled: val });
  };

  // Chargement initial depuis Supabase (Table notifications & salons.notification_settings)
  useEffect(() => {
    let activeChannel = null;

    const loadFromSupabase = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // A. Charger les préférences de son pour le salon de cet utilisateur
        const { data: mySalon } = await supabase
          .from('salons')
          .select('id, notification_settings')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (!mySalon) return;

        if (mySalon.notification_settings) {
          const cfg = mySalon.notification_settings;
          if (typeof cfg.sound_enabled === 'boolean') setSoundEnabledState(cfg.sound_enabled);
          if (typeof cfg.sound_volume === 'number') setSoundVolumeState(cfg.sound_volume);
          if (typeof cfg.voice_enabled === 'boolean') setVoiceEnabledState(cfg.voice_enabled);
          if (cfg.sound_preset) setSoundPresetState(cfg.sound_preset);
        }

        // B. Charger l'historique des notifications STRICTEMENT filtré par salon_id
        const { data: dbNotifs, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('salon_id', mySalon.id)
          .order('created_at', { ascending: false })
          .limit(30);

        if (!error && dbNotifs) {
          const formatted = dbNotifs.map(n => ({
            id: n.id,
            type: n.type || 'booking',
            title: n.title,
            message: n.message,
            appointmentId: n.appointment_id,
            clientName: n.client_name,
            serviceName: n.service_name,
            timeSlot: n.time_slot,
            depositPaid: n.deposit_paid || 0,
            read: n.is_read || false,
            timestamp: n.created_at
          }));
          setNotifications(formatted);
        }

        // C. Écoute Supabase Realtime STRICTEMENT filtrée par salon_id
        activeChannel = supabase
          .channel(`notifs-${mySalon.id}-${Date.now()}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `salon_id=eq.${mySalon.id}`
          }, (payload) => {
            if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id;
              if (deletedId) {
                setNotifications(prev => prev.filter(item => item.id !== deletedId));
              }
              return;
            }

            const n = payload.new;
            if (!n) return;

            const formattedNotif = {
              id: n.id,
              type: n.type || 'booking',
              title: n.title,
              message: n.message,
              appointmentId: n.appointment_id,
              clientName: n.client_name,
              serviceName: n.service_name,
              timeSlot: n.time_slot,
              depositPaid: n.deposit_paid || 0,
              read: n.is_read || false,
              timestamp: n.created_at
            };

            setNotifications(prev => {
              const exists = prev.some(item => item.id === n.id);
              if (exists) {
                return prev.map(item => item.id === n.id ? formattedNotif : item);
              }
              return [formattedNotif, ...prev];
            });
          })
          .subscribe();

      } catch (err) {
        console.warn('Erreur chargement notifications Supabase (fallback local):', err);
      }
    };

    loadFromSupabase();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, []);

  // Sauvegarde locale de sécurité
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications.slice(0, 50)));
    } catch (e) {
      // quota fallback
    }
  }, [notifications]);

  // Nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  /**
   * DÉCLENCHEUR PRINCIPAL D'ALERTE DE RÉSERVATION (NIVEAU 1 + 2 + STOCKAGE SUPABASE)
   */
  const notifyNewBooking = useCallback(async (booking, options = {}) => {
    const clientName = booking.clientName || booking.client_name || 'Nouvelle Cliente';
    const serviceName = booking.serviceName || booking.service_name || 'Prestation';
    const timeSlot = booking.timeSlot || booking.time_slot || '10:00';
    const dateStr = booking.dateStr || booking.date || "Aujourd'hui";
    const depositPaid = booking.depositPaid || booking.deposit_paid || 0;

    const notifItem = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: 'booking',
      title: `🚨 Nouvelle réservation : ${clientName}`,
      message: `${serviceName} • ${dateStr} à ${timeSlot} (Acompte: ${depositPaid.toLocaleString()} FCFA)`,
      clientName,
      serviceName,
      timeSlot,
      depositPaid,
      timestamp: new Date().toISOString(),
      read: false,
      appointmentId: booking.id
    };

    // 1. Enregistrer dans l'état local
    setNotifications(prev => [notifItem, ...prev]);

    // 2. Jouer l'alerte HYPER FORTE (150% volume + Annonce Vocale en Français)
    if (soundEnabled) {
      playSuperLoudBookingAlert({
        clientName,
        serviceName,
        timeSlot,
        dateStr,
        depositPaid
      }, soundVolume || 1.5, voiceEnabled);
    }

    // 3. Afficher le Toast Flottant Animé (Niveau 1 visuel)
    setActiveToast(notifItem);

    // 4. Déclencher la notification Système Web Push (Niveau 2)
    sendSystemNotification({
      title: `🚨 Réservation : ${clientName}`,
      body: `${serviceName} - ${dateStr} à ${timeSlot} • Acompte ${depositPaid.toLocaleString()} FCFA reçu !`,
      tag: `booking-${booking.id || Date.now()}`,
      onClick: options.onNavigateToPlanning
    });

    // 5. Stocker dans la table Supabase `notifications`
    try {
      const salonId = booking.salon_id || booking.salonId || null;
      if (!salonId) return;

      await supabase.from('notifications').insert([{
        id: notifItem.id,
        salon_id: salonId,
        type: notifItem.type,
        title: notifItem.title,
        message: notifItem.message,
        appointment_id: booking.id || null,
        client_name: notifItem.clientName,
        service_name: notifItem.serviceName,
        time_slot: notifItem.timeSlot,
        deposit_paid: notifItem.depositPaid,
        is_read: false,
        created_at: notifItem.timestamp
      }]);
    } catch (dbErr) {
      console.warn('Supabase notifications table insert fallback:', dbErr);
    }

  }, [soundEnabled, soundPreset, soundVolume, voiceEnabled]);

  /**
   * Tester le son et le push immédiatement (Bouton Test à 150% + Voix)
   */
  const triggerTestAlert = useCallback(() => {
    playSuperLoudBookingAlert({
      clientName: 'Awa Diallo',
      serviceName: 'Tresses et Soin capillaire',
      timeSlot: '15:30',
      dateStr: "Aujourd'hui",
      depositPaid: 5000
    }, soundVolume || 1.5, voiceEnabled);

    const testItem = {
      id: 'test-' + Date.now(),
      type: 'test',
      title: '🔊 Alerte 150% + Annonce Vocale Réussie !',
      message: `Sonore à ${Math.round((soundVolume || 1.5) * 100)}% de puissance + Annonce vocale de la cliente, prestation, date et heure.`,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [testItem, ...prev]);
    setActiveToast(testItem);

    sendSystemNotification({
      title: '🚨 Test Alerte Vocale 150% Réussi !',
      body: `Volume sonore maximal actif (150%) avec annonce parlée des rendez-vous.`,
      tag: 'test-sound'
    });
  }, [soundPreset, soundVolume, voiceEnabled]);

  /**
   * Demander la permission push au navigateur
   */
  const requestPush = async () => {
    const res = await requestNotificationPermission();
    setPushPermission(res);
    syncSettingsToSupabase({ push_enabled: res === 'granted' });
    if (res === 'granted') {
      sendSystemNotification({
        title: '✅ Notifications Push Activées !',
        body: 'Vous recevrez les alertes de réservation même si votre navigateur est réduit.'
      });
    }
    return res;
  };

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mySalon } = await supabase.from('salons').select('id').eq('owner_id', user.id).maybeSingle();
      if (mySalon) {
        await supabase.from('notifications').update({ is_read: true }).eq('salon_id', mySalon.id);
      }
    } catch (e) {}
  };

  const clearAll = async () => {
    setNotifications([]);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mySalon } = await supabase.from('salons').select('id').eq('owner_id', user.id).maybeSingle();
      if (mySalon) {
        await supabase.from('notifications').delete().eq('salon_id', mySalon.id);
      }
    } catch (e) {}
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        soundEnabled,
        setSoundEnabled,
        soundVolume,
        setSoundVolume,
        soundPreset,
        setSoundPreset,
        voiceEnabled,
        setVoiceEnabled,
        pushPermission,
        requestPush,
        activeToast,
        dismissToast,
        notifyNewBooking,
        triggerTestAlert,
        markAsRead,
        markAllAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
