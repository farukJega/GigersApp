import { Header } from "@/components/Header";
import { CreateGigForm } from "@/components/CreateGigForm";
import { T } from "@/components/T";

export default function Create() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-5">
        <h1 className="mb-4 text-xl font-extrabold"><T k="post_gig" /></h1>
        <CreateGigForm />
      </main>
    </>
  );
}
