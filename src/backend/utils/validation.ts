export type ValidationErrors = Record<string, string>;

export const isEmail = (value: unknown) =>
  typeof value === "string" && value.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const isNonEmptyString = (value: unknown, min = 1, max = 255) =>
  typeof value === "string" && value.trim().length >= min && value.trim().length <= max;

export const isValidFullName = (value: unknown, min = 2, max = 100) => {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return false;
  return /^[\p{L} ]+$/u.test(trimmed);
};

const isNumericInput = (value: unknown) =>
  (typeof value === "number" && Number.isFinite(value))
  || (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)));

export const isPositiveInt = (value: unknown) => isNumericInput(value) && Number.isInteger(Number(value)) && Number(value) > 0;
export const isNonNegativeInt = (value: unknown) => isNumericInput(value) && Number.isInteger(Number(value)) && Number(value) >= 0;
export const isPositiveNumber = (value: unknown) => isNumericInput(value) && Number(value) > 0;

export const isStrongPassword = (value: unknown) =>
  typeof value === "string" && value.length >= 8 && value.length <= 200 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const trimText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export const isPhone = (value: unknown) =>
  typeof value === "string" && /^(?:0[35789][0-9]{8}|\+84[35789][0-9]{8})$/.test(value.trim());

export const isUrlOrEmpty = (value: unknown) => {
  if (!value || typeof value !== "string" || value.trim() === "") return true;
  if (value.trim().length > 2048) return false;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const hasErrors = (errors: ValidationErrors) => Object.keys(errors).length > 0;
