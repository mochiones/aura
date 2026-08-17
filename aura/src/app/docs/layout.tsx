import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { HashScroller } from "@/components/docs/hash-scroller";

/**
 * Wspólny układ dokumentacji: lewy pasek (API / MCP) + treść.
 * Desktop: dwie kolumny; mobile: pasek poziomy nad treścią.
 * Sidebar wpisów jest ukrywany na /docs przez EntriesSidebarSlot w layoucie root.
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col md:flex-row">
      <HashScroller />
      <DocsSidebar />
      <div className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</div>
    </div>
  );
}
