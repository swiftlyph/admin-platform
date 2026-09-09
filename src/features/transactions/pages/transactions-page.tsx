import { PlaceholderPage } from "@/components/ui/placeholder-page";

/**
 * `/app/transactions`. Placeholder until the backend publishes a contract for
 * this section — see README "Status". Nothing here invents a response
 * shape; the blurb describes the intended scope so the nav destination
 * isn't a blank guess about what will live here.
 */
export function TransactionsPage() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        The marketplace-wide ledger — every transaction between companies, employees, and merchants.
      </p>
      <PlaceholderPage title="Transactions" />
    </div>
  );
}
