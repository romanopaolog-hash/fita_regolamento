export const REGIONS = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', 'Valle d’Aosta', 'Veneto',
] as const;

export function getAccountRegion(value: unknown) {
  return REGIONS.find(region => region === value) ?? '';
}

export function wantsPortalNotifications(user: { unsafeMetadata?: Record<string, unknown> }) {
  // Existing accounts keep their current notification settings until they choose otherwise.
  return user.unsafeMetadata?.notificationsEnabled !== false;
}
