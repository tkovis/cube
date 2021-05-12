const dec2hex = (dec) => dec.toString(16).padStart(2, "0");

// generateId :: Integer -> String
export const generateId = (len) => {
  const arr = new Uint8Array((len || 40) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
};
