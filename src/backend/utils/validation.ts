export type ValidationErrors = Record<string, string>;

export const isEmail = (value: unknown) =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isNonEmptyString = (value: unknown, min = 1, max = 255) =>
  typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

export const isValidFullName = (value: unknown, min = 2, max = 100) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return false;
  return /^[A-Za-zÀ-ỹ\s]+$/u.test(trimmed);
};

export const isPositiveInt = (value: unknown) => Number.isInteger(Number(value)) && Number(value) > 0;
export const isNonNegativeInt = (value: unknown) => Number.isInteger(Number(value)) && Number(value) >= 0;
export const isPositiveNumber = (value: unknown) => Number.isFinite(Number(value)) && Number(value) > 0;

export const isStrongPassword = (value: unknown) =>
  typeof value === "string" && value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const trimText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const isPhone = (value: unknown) =>
  typeof value === "string" && /^(0|\+84)[0-9]{8,10}$/.test(value.trim());

export const isUrlOrEmpty = (value: unknown) => {
  if (!value || typeof value !== "string" || value.trim() === "") return true;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const hasErrors = (errors: ValidationErrors) => Object.keys(errors).length > 0;
