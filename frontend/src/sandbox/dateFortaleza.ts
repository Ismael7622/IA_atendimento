const FORTALEZA_TZ = 'America/Fortaleza';

const partsFor = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FORTALEZA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

export const nowFortaleza = (date = new Date()) => {
  const parts = partsFor(date);
  const dateIso = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  const secondTime = `${parts.hour}:${parts.minute}:${parts.second}`;

  return {
    dateIso,
    dateBr: `${parts.day}/${parts.month}/${parts.year}`,
    time,
    isoNow: `${dateIso}T${secondTime}-03:00`,
    isoEndOfDay: `${dateIso}T23:59:59.999-03:00`,
    n8nNowLabel: new Intl.DateTimeFormat('pt-BR', {
      timeZone: FORTALEZA_TZ,
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  };
};
