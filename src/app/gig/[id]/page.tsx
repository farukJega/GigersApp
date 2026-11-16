import { Suspense } from "react";
import { Header } from "@/components/Header";
import { GigDetails } from "@/components/GigDetails";

export default function GigPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-5">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl border border-line bg-card" />}>
          <GigDetails />
        </Suspense>
      </main>
    </>
  );
}
