export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateUsername = (username) => {
  if (typeof username !== "string") return false;
  if (username.length < 3 || username.length > 30) return false;
  return /^[a-zA-Z0-9_-]+$/.test(username);
};

export const validatePassword = (password) => {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  // At least 1 number
  return /\d/.test(password);
};

export const validateNonEmpty = (str) => {
  return typeof str === "string" && str.trim().length > 0;
};

export const validateRating = (rating) => {
  const r = Number(rating);
  return r >= 1 && r <= 10 && Number.isInteger(r);
};
