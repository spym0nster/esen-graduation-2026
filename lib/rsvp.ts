export interface RSVPEntry {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classe: string;
  specialty: string;
  guestCount: number;
}

export interface StudentRecord extends RSVPEntry {
  scanned: boolean;
  guestsScanned: boolean[];
  scannedAt?: string;
}

export interface GuestRecord {
  guestIndex: number;
  parentId: string;
  parentName: string;
  classe: string;
  specialty: string;
  scanned: boolean;
  scannedAt?: string | null;
}

export const VALID_CLASSES = ["L1", "L2", "L3", "M1", "M2", "Autre"];
export const VALID_SPECIALTIES = ["BC", "BI", "Business Information System", "E-Business", "VIC", "DSSD", "WI", "Autre"];

export function validateRSVP(data: Partial<RSVPEntry>): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = "Prénom requis (min 2 caractères)";
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = "Nom requis (min 2 caractères)";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.email = "Email invalide";
  }

  if (!data.phone) {
    errors.phone = "Numéro de téléphone requis";
  } else {
    const stripped = data.phone.replace(/[\s-]/g, "");
    if (!/^\d{8,}$/.test(stripped)) {
      errors.phone = "Numéro invalide (min 8 chiffres)";
    }
  }

  if (!data.classe || !VALID_CLASSES.includes(data.classe)) {
    errors.classe = "Classe invalide";
  }

  if (!data.specialty || !VALID_SPECIALTIES.includes(data.specialty)) {
    errors.specialty = "Spécialité invalide";
  }

  if (data.guestCount === undefined || data.guestCount < 0 || data.guestCount > 2) {
    errors.guestCount = "Nombre d'invités invalide (0-2 max)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
