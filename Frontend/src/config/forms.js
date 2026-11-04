// Where the Feedback and Contribute forms send their data.
// Backend/docs/forms-backend-handoff.md describes what that address must do.
//
//   ""                     the forms are closed: the pages show, but nothing can be sent
//   "/api"                 this website's own server (needs FORMS_BACKEND=on there)
//   "https://example.org"  a separate service
//
// To open the forms, change the "" below and deploy. Never put a Telegram token or any other
// secret in this folder: everything in the frontend can be read by every visitor.
export const FORMS_API_URL = (import.meta.env.VITE_FORMS_API_URL ?? "").replace(/\/+$/, "");
export const FORMS_OPEN = FORMS_API_URL !== "";

// The /admin inbox only works with this website's own forms backend. Change "off" to "on" to use it.
export const ADMIN_PAGE_ENABLED = (import.meta.env.VITE_ADMIN_PAGE ?? "off") === "on";
