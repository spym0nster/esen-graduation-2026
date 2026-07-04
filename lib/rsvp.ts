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

// Roles that are not students → no specialty required.
export const NON_STUDENT_ROLES = ["Professeur", "Administration"];
export const VALID_CLASSES = ["L1", "L2", "L3", "M1", "M2", "Autre", ...NON_STUDENT_ROLES];
export const VALID_SPECIALTIES = ["BI", "BIS", "EBUS", "E-MDS", "DSSD", "WI", "EBUS (en ligne)", "VIC", "CGBI", "Autre"];

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
  } else {
    const domain = data.email.split("@")[1].toLowerCase().trim();
    const allowedDomains = ["esen.tn", "esen.uma.tn"];
    if (!allowedDomains.includes(domain)) {
      errors.email = "Veuillez utiliser votre adresse e-mail ESEN (@esen.tn ou @esen.uma.tn)";
    }
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

  // Specialty is required only for students, not for Professeur / Administration.
  const isNonStudent = !!data.classe && NON_STUDENT_ROLES.includes(data.classe);
  if (!isNonStudent && (!data.specialty || !VALID_SPECIALTIES.includes(data.specialty))) {
    errors.specialty = "Spécialité invalide";
  }

  if (data.guestCount === undefined || data.guestCount < 0 || data.guestCount > 3) {
    errors.guestCount = "Nombre d'invités invalide (0-3 max)";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
