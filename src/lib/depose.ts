export type DeposeChoice = "NONE" | "SALON" | "EXTERIEURE";

export const DEPOSE_EXTRA_MINUTES = 30;
export const DEPOSE_EXTERIEURE_SURCHARGE = 15;

export function deposeExtraMinutes(depose: DeposeChoice): number {
  return depose === "NONE" ? 0 : DEPOSE_EXTRA_MINUTES;
}

export function deposeSurcharge(depose: DeposeChoice): number {
  return depose === "EXTERIEURE" ? DEPOSE_EXTERIEURE_SURCHARGE : 0;
}

export function deposeLabel(depose: DeposeChoice): string | null {
  if (depose === "SALON") return "Dépose (posée chez nous) incluse — offerte";
  if (depose === "EXTERIEURE") return "Dépose extérieure incluse (+15€)";
  return null;
}
