export type WorkSubmission = {
  v: 1;
  gigId: string;
  index: number;
  note: string;
  links: string[];
  finalLinks: string[];
  files: string[];
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
  if (note.length > 2000) return { ok: false, error: "Note must be 2000 characters or less." };

  const urls = (x: unknown, max: number) => {
    const list = (Array.isArray(x) ? x : []).map(str).filter(Boolean);
    if (list.length > max) return { error: `You can add up to ${max} links.` };
    const bad = list.find((l) => {
      if (l.length > 300) return true;
      try {
        const u = new URL(l);
        return u.protocol !== "https:" && u.protocol !== "http:";
      } catch {
        return true;
      }
    });
    if (bad) return { error: "Each link must be a valid http(s) URL." };
    return { list };
  };

  const a = urls(input.links, 5);
  if ("error" in a) return { ok: false, error: a.error as string };
  const b = urls(input.finalLinks, 3);
  if ("error" in b) return { ok: false, error: b.error as string };

  const files = Array.from(
    new Set(
      (Array.isArray(input.files) ? input.files : [])
        .map(str)
        .filter((f) => /^0x[0-9a-fA-F]{64}$/.test(f))
        .map((f) => f.toLowerCase())
    )
  );
  if (files.length > 5) return { ok: false, error: "You can attach up to 5 images." };

  const links = (a.list ?? []) as string[];
  const finalLinks = (b.list ?? []) as string[];
  if (!note && links.length + finalLinks.length + files.length === 0)
    return { ok: false, error: "Add a note, a link or an image to your work." };

  const data: WorkSubmission = { v: 1, gigId, index, note, links, finalLinks, files };
  return { ok: true, data, json: JSON.stringify(data) };
}
