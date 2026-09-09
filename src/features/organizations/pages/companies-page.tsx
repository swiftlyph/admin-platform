import { PlaceholderPage } from "@/components/ui/placeholder-page";

/**
 * `/app/companies`. Placeholder until the backend publishes a contract for
 * this section — see README "Status". Nothing here invents a response
 * shape; the blurb describes the intended scope so the nav destination
 * isn't a blank guess about what will live here.
 */
export function CompaniesPage() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Every company on the marketplace, with the employees and balances that roll up to it.
      </p>
      <PlaceholderPage title="Companies" />
    </div>
  );
}
