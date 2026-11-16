import { Header } from "@/components/Header";

export default function Create() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-dashed border-line bg-card p-8 text-center">
          <h1 className="text-xl font-extrabold">Post a Gig</h1>
          <p className="mt-2 text-sm text-muted">
            The funded gig form (USDC approve and escrow deposit) is the next step.
          </p>
        </div>
      </main>
    </>
  );
}
