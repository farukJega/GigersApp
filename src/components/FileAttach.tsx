"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useLang } from "./LanguageProvider";
import { useSession } from "./SessionProvider";
import { SecureImage } from "./SecureImage";

const MAX_FILES = 5;

function encode(bmp: ImageBitmap, max: number, quality: number, mark: boolean) {
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported on this device.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  if (mark) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 6);
    const size = Math.max(14, Math.round(Math.max(w, h) / 14));
    ctx.font = `bold ${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(1, size / 12);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    const text = "GIGERSAPP PREVIEW";
    const span = Math.max(w, h) * 1.4;
    for (let y = -span; y <= span; y += size * 2.6)
      for (let x = -span; x <= span; x += size * 11) {
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      }
    ctx.restore();
  }
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}

export function FileAttach({
  files,
  onChange,
  gigId,
}: {
  files: string[];
  onChange: (f: string[]) => void;
  gigId: string;
}) {
  const { t } = useLang();
  const { token, signIn } = useSession();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setErr("");
    setBusy(true);
    try {
      const tk = token ?? (await signIn());
      if (!tk) throw new Error("Sign in with your wallet to upload.");
      let next = [...files];
      for (const f of Array.from(list)) {
        if (next.length >= MAX_FILES) break;
        if (!f.type.startsWith("image/")) throw new Error("Only images can be uploaded.");
        let bmp: ImageBitmap;
        try {
          bmp = await createImageBitmap(f);
        } catch {
          throw new Error("This image format is not supported. Use JPG or PNG.");
        }
        const full = encode(bmp, 1600, 0.85, false);
        const preview = encode(bmp, 480, 0.5, true);
        bmp.close();
        const res = await fetch("/api/file", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
          body: JSON.stringify({ gigId, full, preview }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Upload failed.");
        if (!next.includes(j.id)) next = [...next, j.id];
        onChange(next);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
      <button
        type="button"
        disabled={busy || files.length >= MAX_FILES}
        onClick={() => input.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-card2 py-3 text-sm font-semibold disabled:opacity-50"
      >
        <ImagePlus size={18} />
        {busy ? t("w_uploading", "Uploading...") : t("w_upload", "Upload images")} ({files.length}/{MAX_FILES})
      </button>
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {files.map((id) => (
            <div key={id} className="relative">
              <SecureImage id={id} thumb className="h-20 w-full rounded-lg object-cover" />
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onChange(files.filter((f) => f !== id))}
                className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
