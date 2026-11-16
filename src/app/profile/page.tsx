import { Header } from "@/components/Header";
import { MyProfileRedirect } from "@/components/MyProfileRedirect";

export default function MyProfile() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-5">
        <MyProfileRedirect />
      </main>
    </>
  );
}
