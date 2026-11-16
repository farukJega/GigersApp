import { Header } from "@/components/Header";
import { DashboardView } from "@/components/DashboardView";

export default function Dashboard() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-5">
        <DashboardView />
      </main>
    </>
  );
}
