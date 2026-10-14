export function databaseErrorMessage(error: unknown, fallback: string): string {
  const details = error as { code?: string; message?: string } | null;
  if (/invalid api key/i.test(details?.message || '')) {
    return "De websiteconfiguratie is ongeldig.";
  }
  if (details?.code === '42501') {
    return "Toegang tot de database geweigerd. Neem contact op met de beheerder.";
  }
  if (details?.code === 'PGRST204' || details?.code === '42P01' || details?.code === '42703') {
    return "De database moet worden bijgewerkt. Neem contact op met de beheerder.";
  }
  return fallback;
}
