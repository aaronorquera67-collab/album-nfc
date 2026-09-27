import { BrandLockup } from "@/components/brand-lockup";

export function LandingFooter() {
  return (
    <footer className="border-t border-borde px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-6xl items-center">
        <div className="flex min-w-0 flex-col gap-1.5">
          <BrandLockup size="sm" href="/" />

          <p className="text-xs text-muted-foreground">
            Tus recuerdos, a un toque.
          </p>
        </div>
      </div>
    </footer>
  );
}