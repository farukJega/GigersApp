export function Avatar({ address, name, size = 64 }: { address: string; name?: string; size?: number }) {
  const a = (address || "0x000000").toLowerCase();
  const h1 = (parseInt(a.slice(2, 4), 16) * 360) / 256;
  const h2 = (parseInt(a.slice(4, 6), 16) * 360) / 256;
  const letter = (name && name.trim()[0]) || a.slice(2, 4);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-extrabold uppercase text-white"
      style={{
        width: size,
        height: size,
        fontSize: size / 2.6,
        background: `linear-gradient(135deg, hsl(${h1} 80% 55%), hsl(${h2} 80% 45%))`,
      }}
    >
      {letter}
    </span>
  );
}
