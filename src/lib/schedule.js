export const DEFAULT_SCHEDULE = {
  lundi: { label: 'Lundi', open: false, start: '09:30', end: '19:30' },
  mardi: { label: 'Mardi', open: true, start: '09:30', end: '19:30' },
  mercredi: { label: 'Mercredi', open: true, start: '09:30', end: '19:30' },
  jeudi: { label: 'Jeudi', open: true, start: '09:30', end: '19:30' },
  vendredi: { label: 'Vendredi', open: true, start: '09:30', end: '19:30' },
  samedi: { label: 'Samedi', open: true, start: '09:00', end: '20:00' },
  dimanche: { label: 'Dimanche', open: true, start: '10:00', end: '18:00' }
};

export const DAY_ORDER = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
export const JS_DAY_TO_KEY = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export const formatScheduleSummary = (schedule) => {
  if (!schedule) return 'Mardi au Dimanche : 09h30 - 19h30 (Fermé le Lundi)';
  const closed = DAY_ORDER.filter(k => !schedule[k]?.open);
  const open = DAY_ORDER.filter(k => schedule[k]?.open);

  if (open.length === 0) return 'Temporairement fermé';
  if (closed.length === 0) return 'Ouvert 7j/7';

  const closedNames = closed.map(k => schedule[k]?.label || k).join(', ');
  const firstOpen = schedule[open[0]];
  const uniform = open.every(k => schedule[k]?.start === firstOpen.start && schedule[k]?.end === firstOpen.end);

  if (uniform) {
    const s = firstOpen.start.replace(':', 'h');
    const e = firstOpen.end.replace(':', 'h');
    return `${schedule[open[0]].label} au ${schedule[open[open.length - 1]].label} : ${s} - ${e} (Fermé : ${closedNames})`;
  }
  return `${open.length} jours d'ouverture par semaine (Fermé : ${closedNames})`;
};

export const generateNextDays = (schedule = DEFAULT_SCHEDULE, count = 14) => {
  let parsedSchedule = schedule;
  if (typeof parsedSchedule === 'string') {
    try {
      parsedSchedule = JSON.parse(parsedSchedule);
    } catch {
      parsedSchedule = DEFAULT_SCHEDULE;
    }
  }
  if (!parsedSchedule || typeof parsedSchedule !== 'object') {
    parsedSchedule = DEFAULT_SCHEDULE;
  }

  const result = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const jsDay = d.getDay();
    const dayKey = JS_DAY_TO_KEY[jsDay];
    const dayConfig = (parsedSchedule && parsedSchedule[dayKey]) ? parsedSchedule[dayKey] : { open: false, label: dayKey };

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    let label = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : (dayConfig.label || dayKey);
    const monthsFr = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    const subLabel = `${d.getDate()} ${monthsFr[d.getMonth()]}`;

    result.push({
      dateStr,
      label,
      subLabel,
      dayKey,
      dayName: dayConfig.label || dayKey,
      isOpen: !!dayConfig.open,
      config: dayConfig
    });
  }

  return result;
};

export const parseDurationMins = (str) => {
  if (!str) return 45;
  const s = String(str).toLowerCase().trim();
  if (s.includes('journée entière')) return 14 * 60;
  if (s.includes('demi-journée')) return 4 * 60;
  
  let total = 0;
  const hMatch = s.match(/(\d+)\s*h(?:eures?)?/);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  
  const mMatch = s.match(/(\d+)\s*(?:min|m)?$/) || s.match(/h\s*(\d+)/);
  if (mMatch && !hMatch) total += parseInt(mMatch[1], 10);
  else if (mMatch && hMatch && s.includes('h')) {
    const afterH = s.split('h')[1];
    const mins = parseInt(afterH, 10);
    if (!isNaN(mins)) total += mins;
  }
  
  if (total === 0) {
    const num = parseInt(s, 10);
    if (!isNaN(num)) total = num;
  }
  return total > 0 ? total : 45;
};

export const generateSlots = (
  dayConfig,
  intervalMinutes = 45,
  existingBookings = [],
  dateStr = '',
  options = {}
) => {
  if (!dayConfig || !dayConfig.open || !dayConfig.start || !dayConfig.end) {
    return [];
  }

  const interval = Math.max(15, parseInt(intervalMinutes, 10) || 45);

  const parseMins = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const startMins = parseMins(dayConfig.start);
  const endMins = parseMins(dayConfig.end);
  if (endMins <= startMins) return [];

  const todayStr = new Date().toISOString().split('T')[0];
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStr = tmr.toISOString().split('T')[0];

  // Durée de la nouvelle prestation choisie par la cliente (ex: 2h = 120 min)
  const serviceDur = parseDurationMins(options.serviceDuration || '45 min');
  const selectedPractitioner = options.selectedPractitioner || null; // Nom de la praticienne ou null/'' (peu importe)
  const team = Array.isArray(options.team) ? options.team : [];
  const isSolo = options.isSolo !== undefined ? options.isSolo : (team.length === 0);

  // Booked & Blocked intervals on this date
  const bookedRanges = (existingBookings || [])
    .filter(b => {
      if (!b || b.status === 'cancelled' || b.status === 'expired') return false;
      if (b.status === 'pending' && b.expires_at && new Date(b.expires_at) <= new Date()) return false;
      if (b.status === 'pending' && b.expiresAt && new Date(b.expiresAt) <= new Date()) return false;
      const bDate = String(b.date || '');
      const bDateStr = String(b.dateStr || '');
      const bFormatted = String(b.dateFormatted || '');
      
      // Check exact match
      if (bDate === dateStr || bDateStr === dateStr) return true;
      if (dateStr && (bDate.includes(dateStr) || bDateStr.includes(dateStr) || bFormatted.includes(dateStr))) return true;

      // Check relative terms ('Aujourd'hui' / 'Demain')
      if (dateStr === todayStr && (bDate.includes("Aujourd'hui") || bFormatted.includes("Aujourd'hui"))) return true;
      if (dateStr === tomorrowStr && (bDate.includes("Demain") || bFormatted.includes("Demain"))) return true;

      return false;
    })
    .map(b => {
      const timeStr = b?.timeSlot || b?.time;
      const start = parseMins(timeStr);
      const dur = parseDurationMins(b?.duration || '45 min');
      return {
        start,
        end: start + dur,
        exactTime: timeStr,
        practitionerName: b?.practitioner_name || b?.practitionerName || null,
        isBlocked: b?.is_blocked || b?.status === 'blocked'
      };
    })
    .filter(r => r.exactTime);

  const slots = [];
  let current = startMins;

  while (current + interval <= endMins) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeFormatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const candStart = current;
    const candEnd = current + serviceDur;

    // 1. Règle de fermeture du salon : la prestation entière doit se terminer avant la fermeture
    if (candEnd > endMins) {
      slots.push({
        time: timeFormatted,
        available: false,
        reason: 'Dépasse l\'horaire de fermeture'
      });
      current += interval;
      continue;
    }

    // 2. Vérification des collisions avec les réservations existantes
    // Collision si : candStart < b.end && candEnd > b.start
    let isAvailable = true;
    let busyReason = '';
    let availablePractitioners = [];

    if (isSolo || team.length === 0) {
      // MODE SOLO : Tout rendez-vous ou blocage sur cet intervalle bloque le salon entier
      const conflict = bookedRanges.find(r => candStart < r.end && candEnd > r.start);
      if (conflict) {
        isAvailable = false;
        busyReason = 'Créneau occupé';
      }
    } else {
      // MODE ÉQUIPE (Plusieurs coiffeuses)
      if (selectedPractitioner && selectedPractitioner !== 'any') {
        // La cliente a choisi une coiffeuse en particulier (ex: "Amina")
        const conflict = bookedRanges.find(r => {
          if (candStart >= r.end || candEnd <= r.start) return false;
          // Si c'est un blocage général du salon (ex: fermeture exceptionnelle) ou si c'est assigné à cette praticienne
          if (r.isBlocked && !r.practitionerName) return true;
          return r.practitionerName === selectedPractitioner;
        });

        if (conflict) {
          isAvailable = false;
          busyReason = `${selectedPractitioner} est déjà occupée`;
        }
      } else {
        // La cliente a choisi "Peu importe / Première disponible"
        // On vérifie s'il existe au moins une coiffeuse de l'équipe libre pendant tout le créneau
        const freeMembers = team.filter(member => {
          const memberConflict = bookedRanges.some(r => {
            if (candStart >= r.end || candEnd <= r.start) return false;
            if (r.isBlocked && !r.practitionerName) return true;
            return r.practitionerName === member.name;
          });
          return !memberConflict;
        });

        availablePractitioners = freeMembers.map(m => m.name);
        if (freeMembers.length === 0) {
          isAvailable = false;
          busyReason = 'Toutes les coiffeuses sont occupées';
        }
      }
    }

    slots.push({
      time: timeFormatted,
      available: isAvailable,
      reason: busyReason,
      availablePractitioners
    });

    current += interval;
  }

  return slots;
};

