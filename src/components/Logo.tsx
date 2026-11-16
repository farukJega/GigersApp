export function Logo({ size = 36, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="GigersApp" width={size} height={size} />
      {withName && (
        <span className="text-lg font-bold tracking-tight">
          Gigers<span className="text-brand">App</span>
        </span>
      )}
    </span>
  );
}
