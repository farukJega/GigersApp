import { Header } from "@/components/Header";
import { CreateGigForm } from "@/components/CreateGigForm";

export default function Create() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-5">
        <h1 className="mb-4 text-xl font-extrabold">Post a Gig</h1>
        <CreateGigForm />
      </main>
    </>
  );
}
