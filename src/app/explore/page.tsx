import { Header } from "@/components/Header";
import { ExploreView } from "@/components/ExploreView";

export default function Explore() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-5">
        <ExploreView />
      </main>
    </>
  );
}
