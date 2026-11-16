import { createElement } from "react";
import { Code, Palette, Clapperboard, PenLine, Bot, Coins, Megaphone, Headset, Smartphone, Database, type LucideIcon } from "lucide-react";

const map: Record<string, LucideIcon> = {
  code: Code,
  palette: Palette,
  video: Clapperboard,
  pen: PenLine,
  bot: Bot,
  coins: Coins,
  megaphone: Megaphone,
  headset: Headset,
  phone: Smartphone,
  data: Database,
};

export function CategoryIcon({ name, size = 22 }: { name: string; size?: number }) {
  return createElement(map[name] ?? Code, { size });
}
