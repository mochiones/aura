import { EntriesProvider } from "@/context/entries-context";
import { DesktopHeader } from "@/components/navigation/desktop-header";
import { EntriesSidebar } from "@/components/entries-sidebar";

// Layout właściwej aplikacji (chrome + kontekst wpisów).
// Dostęp chroni middleware — tu trafiają tylko zalogowani użytkownicy.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <EntriesProvider>
      <div className="h-dvh flex flex-col overflow-hidden">
        <DesktopHeader />

        {/* Desktop: dwie kolumny, niezależne scrollowanie paneli */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <EntriesSidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>

        {/* Mobile: pojedyncza kolumna, naturalne scrollowanie */}
        <main className="md:hidden flex-1 overflow-y-auto">{children}</main>
      </div>
    </EntriesProvider>
  );
}
