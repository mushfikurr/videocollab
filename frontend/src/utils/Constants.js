export const API_URL =
  !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ? ""
    : "https://redacted-api-cw.herokuapp.com";
