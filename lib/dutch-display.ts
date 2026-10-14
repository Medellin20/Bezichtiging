// Display labels only. Stored values and submission contracts stay unchanged.
const optionLabels: Record<string, string> = {
  appartement: 'Appartement', maison: 'Huis', studio: 'Studio', loft: 'Loft', autre: 'Anders',
  matin: 'Ochtend', 'apres-midi': 'Middag', soir: 'Avond',
  physique: 'Op locatie', virtuelle: 'Virtuele bezichtiging',
  cdi: 'Vast contract', cdd: 'Tijdelijk contract', interim: 'Uitzendwerk',
  independant: "Zelfstandige / zzp'er", fonctionnaire: 'Ambtenaar',
  etudiant: 'Student', retraite: 'Gepensioneerd', 'sans-emploi': 'Werkzoekend',
};

export function dutchOption(value: string | null): string {
  return value ? optionLabels[value] || value : 'Niet opgegeven';
}

export function formatEuro(value: number | string): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(Number(value));
}

export function formatDutchDate(value: string | null): string {
  if (!value) return 'Niet opgegeven';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('nl-NL');
}

export function paymentInstructionsLabel(value: string): string {
  const originalDefault = 'Veuillez effectuer le paiement des frais de visite pour finaliser votre demande. Vous pouvez utiliser le lien de paiement en ligne ou effectuer un virement bancaire avec les coordonnées RIB ci-dessus.';
  return value === originalDefault
    ? 'Betaal de bezichtigingskosten om uw aanvraag af te ronden. Gebruik de online betaallink of maak het bedrag over via de bovenstaande bankgegevens.'
    : value;
}
