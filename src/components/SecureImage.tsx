"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { useSession } from "./SessionProvider";

export function SecureImage({
  id,
  paid,
  thumb,
  className = "w-full rounded-lg object-cover",
}: {
  id: string;
  paid?: boolean;
  thumb?: boolean;
  className?: string;
}) {
  const { token } = useSession();
  const [url, setUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    let objectUrl = "";
    (async () => {
      try {
        const res = await fetch(`/api/file?id=${id}${thumb ? "&v=preview" : ""}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("load");
        const b = await res.blob();
        objectUrl = URL.createObjectURL(b);
        if (!alive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setBlob(b);
        setUrl(objectUrl);
        setQuality(res.headers.get("X-Gigers-Quality") ?? "preview");
        setErr("");
      } catch {
        if (alive) setErr("Could not load image.");
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, token, thumb, paid]);

  async function copyImage() {
    if (!blob) return;
    try {
      const bmp = await createImageBitmap(blob);
      const c = document.createElement("canvas");
      c.width = bmp.width;
      c.height = bmp.height;
      c.getContext("2d")?.drawImage(bmp, 0, 0);
      bmp.close();
      const png: Blob = await new Promise((resolve, reject) =>
        c.toBlob((x) => (x ? resolve(x) : reject(new Error("fail"))), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setErr("Copy is not supported on this browser. Use Download.");
    }
  }

  if (!url) {
    return (
      <div className={`flex h-20 items-center justify-center rounded-lg bg-card text-xs text-muted ${thumb ? "" : "h-32"}`}>
        {err || "..."}
      </div>
    );
  }

  const canSave = !thumb && !!paid && quality === "full";

  return (
    <div className="space-y-1.5">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className={className}
          style={{ WebkitTouchCallout: "none", userSelect: "none" }}
        />
        {quality === "preview" && !thumb && (
          <span className="absolute start-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            PREVIEW
          </span>
        )}
      </div>
      {canSave && (
        <div className="grid grid-cols-2 gap-1.5">
          <a
            href={url}
            download={`gigers-${id.slice(2, 10)}.jpg`}
            className="flex items-center justify-center gap-1 rounded-lg border border-line bg-card py-2 text-xs font-bold"
          >
            <Download size={14} /> Download
          </a>
          <button
            type="button"
            onClick={copyImage}
            className="flex items-center justify-center gap-1 rounded-lg border border-line bg-card py-2 text-xs font-bold"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
