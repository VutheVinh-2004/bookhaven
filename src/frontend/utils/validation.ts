export const isValidFullName = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 100 && /^[\p{L} ]+$/u.test(trimmed);
};

export const isStrongPassword = (value: string) =>
  value.length >= 8 && value.length <= 200 && /[A-Za-z]/.test(value) && /\d/.test(value);

export const isValidVietnamPhone = (value: string) =>
  /^(?:0[35789][0-9]{8}|\+84[35789][0-9]{8})$/.test(value.trim());
