// The contact form's "What's it about?" choices, shared by the form and
// /api/contact (which only accepts these).

export const CONTACT_TOPICS = [
  "A question about my order",
  "Pickup or delivery",
  "Ingredients or allergies",
  "Something else",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];
