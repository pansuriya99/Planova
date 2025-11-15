/* ----------------------- Get token from localStorage ---------------------- */
export const getToken = () => localStorage.getItem("token");

/* --------------------- Remove token from localStorage --------------------- */
export const removeToken = () => localStorage.removeItem("token");

/* ------------------ Check if token is valid (not expired) ----------------- */
export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
    const expiry = payload.exp * 1000; // exp is in seconds
    return Date.now() < expiry;
  } catch (err) {
    return false; // invalid token
  }
};

/* -------------------- Returns true if login is required ------------------- */
export const isLoginRequired = () => !isTokenValid();
