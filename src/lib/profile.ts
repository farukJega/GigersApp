import { categories } from "./categories";

export type Profile = {
  v: 1;
  name: string;
  title: string;
  bio: string;
  company: string;
  skills: string[];
  categories: string[];
  links: string[];
};

export function profileMessage(address: string, hash: string, time: number) {
  return `GigersApp profile update\nAddress: ${address.toLowerCase()}\nHash: ${hash}\nTime: ${time}`;
}

export function normalizeProfile(
  input: Record<string, unknown>
): { ok: true; data: Profile; json: string } | { ok: false; error: string } {
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const list = (x: unknown) => (Array.isArray(x) ? x : []).map(str).filter(Boolean);

  const name = str(input.name);
  const title = str(input.title);
  const company = str(input.company);
  const bio = str(input.bio);
  if (name.length > 40) return { ok: false, error: "Name must be 40 characters or less." };
  if (title.length > 80) return { ok: false, error: "Title must be 80 characters or less." };
  if (company.length > 80) return { ok: false, error: "Company must be 80 characters or less." };
  if (bio.length > 600) return { ok: false, error: "Biography must be 600 characters or less." };

  const skills = Array.from(new Set(list(input.skills)));
  if (skills.length > 10) return { ok: false, error: "Add up to 10 skills." };
  if (skills.some((s) => s.length > 30))
    return { ok: false, error: "Each skill must be 30 characters or less." };

  const cats = Array.from(new Set(list(input.categories)));
  if (cats.some((c) => !categories.some((x) => x.slug === c)))
    return { ok: false, error: "Invalid category." };

  const links = list(input.links);
  if (links.length > 5) return { ok: false, error: "Add up to 5 links." };
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

  const data: Profile = { v: 1, name, title, bio, company, skills, categories: cats, links };
  return { ok: true, data, json: JSON.stringify(data) };
}
