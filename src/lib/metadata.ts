import { categories } from "./categories";

export type GigMetadata = {
  v: 1;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  skills: string[];
  links: string[];
  quick: boolean;
  milestones: string[];
};

type Input = Record<string, unknown>;

export function normalizeMetadata(
  input: Input
): { ok: true; data: GigMetadata; json: string } | { ok: false; error: string } {
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const title = str(input.title);
  const description = str(input.description);
  const category = str(input.category);
  const subcategory = str(input.subcategory);

  if (title.length < 5 || title.length > 120)
    return { ok: false, error: "Title must be 5 to 120 characters." };
  if (description.length < 20 || description.length > 5000)
    return { ok: false, error: "Description must be 20 to 5000 characters." };

  const cat = categories.find((c) => c.slug === category);
  if (!cat) return { ok: false, error: "Choose a valid category." };
  if (!cat.subs.includes(subcategory))
    return { ok: false, error: "Choose a valid subcategory." };

  const skills = Array.from(
    new Set((Array.isArray(input.skills) ? input.skills : []).map(str).filter(Boolean))
  );
  if (skills.length < 1 || skills.length > 10)
    return { ok: false, error: "Add 1 to 10 skills, separated by commas." };
  if (skills.some((s) => s.length > 30))
    return { ok: false, error: "Each skill must be 30 characters or less." };

  const links = (Array.isArray(input.links) ? input.links : []).map(str).filter(Boolean);
  if (links.length > 5) return { ok: false, error: "You can add up to 5 links." };
  const badLink = links.find((l) => {
    if (l.length > 300) return true;
    try {
      const u = new URL(l);
      return u.protocol !== "https:" && u.protocol !== "http:";
    } catch {
      return true;
    }
  });
  if (badLink) return { ok: false, error: "Each reference link must be a valid http(s) URL." };

  const milestones = (Array.isArray(input.milestones) ? input.milestones : []).map(str);
  if (milestones.length < 1 || milestones.length > 10)
    return { ok: false, error: "A gig needs 1 to 10 milestones." };
  if (milestones.some((m) => m.length < 1 || m.length > 60))
    return { ok: false, error: "Each milestone needs a title (max 60 characters)." };

  const data: GigMetadata = {
    v: 1,
    title,
    description,
    category,
    subcategory,
    skills,
    links,
    quick: input.quick === true,
    milestones,
  };
  return { ok: true, data, json: JSON.stringify(data) };
}
