"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useLang } from "./LanguageProvider";

const MAX_FILES = 5;

async function toJpegBase64(file: File): Promise<string> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error("This image format is not supported. Use JPG or PNG.");
  }
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
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
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

export function FileAttach({
  files,
  onChange,
}: {
  files: string[];
  onChange: (f: string[]) => void;
}) {
  const { t } = useLang();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pick(list: FileList | null) {
    if (!list || list.length === 0) return;
    setErr("");
    setBusy(true);
    try {
      let next = [...files];
      for (const f of Array.from(list)) {
        if (next.length >= MAX_FILES) break;
        if (!f.type.startsWith("image/")) throw new Error("Only images can be uploaded.");
        const data = await toJpegBase64(f);
        const res = await fetch("/api/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
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
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/file?id=${id}`} alt="" className="h-20 w-full rounded-lg object-cover" />
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

export function WorkFiles({ ids }: { ids: string[] }) {
  const valid = ids.filter((i) => /^0x[0-9a-fA-F]{64}$/.test(i));
  if (valid.length === 0) return null;
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {valid.map((id) => (
        <a key={id} href={`/api/file?id=${id}`} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/file?id=${id}`} alt="" className="w-full rounded-lg object-cover" />
        </a>
      ))}
    </div>
  );
}
