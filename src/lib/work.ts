export type WorkSubmission = {
  v: 1;
  gigId: string;
  index: number;
  note: string;
  links: string[];
};

export function normalizeWork(
  input: Record<string, unknown>
): { ok: true; data: WorkSubmission; json: string } | { ok: false; error: string } {
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const gigId = str(input.gigId);
  const index = typeof input.index === "number" ? input.index : -1;
  const note = str(input.note);

  if (!/^\d{1,9}$/.test(gigId)) return { ok: false, error: "Invalid gig." };
  if (!Number.isInteger(index) || index < 0 || index > 9)
    return { ok: false, error: "Invalid milestone." };
  if (note.length > 2000)
    return { ok: false, error: "Note must be 2000 characters or less." };

  const links = (Array.isArray(input.links) ? input.links : []).map(str).filter(Boolean);
  if (links.length > 5) return { ok: false, error: "You can add up to 5 links." };
  const bad = links.find((l) => {
    if (l.length > 300) return true;
    try {
      const u = new URL(l);
      return u.protocol !== "https:" && u.protocol !== "http:";
    } catch {
      return true;
    }
  });
  if (bad) return { ok: false, error: "Each link must be a valid http(s) URL." };

  if (note.length < 1 && links.length < 1)
    return { ok: false, error: "Add a note or at least one link to your work." };

  const data: WorkSubmission = { v: 1, gigId, index, note, links };
  return { ok: true, data, json: JSON.stringify(data) };
}
