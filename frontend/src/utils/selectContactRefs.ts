export type TaskLike = {
  contact_id?: string | null;
  contact?: { id?: string | null; phone?: string | null } | null;
  metadata?: Record<string, unknown> | null;
};

function asString(x: unknown): string | undefined {
  return typeof x === "string" && x.trim() ? x : undefined;
}

/**
 * Returns exactly one of { contactId } or { whatsapp } (E.164).
 * Preference order: contact_id -> contact.id -> metadata.contact_id
 * Phone fallback order: contact.phone -> metadata.contact_phone -> metadata.from
 */
export function deriveContactRefs(task: TaskLike): { contactId?: string; whatsapp?: string } {
  // Prefer stable ID
  const id =
    asString(task.contact_id) ??
    asString(task.contact?.id) ??
    asString(task.metadata?.["contact_id"]);

  if (id) return { contactId: id };

  // Phone fallback (E.164)
  const phone =
    asString(task.contact?.phone) ??
    asString(task.metadata?.["contact_phone"]) ??
    asString(task.metadata?.["from"]); // from Twilio ingest

  return phone ? { whatsapp: phone } : {};
}
