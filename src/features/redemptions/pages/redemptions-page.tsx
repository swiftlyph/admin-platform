import { PlaceholderPage } from "@/components/ui/placeholder-page";

/**
 * `/app/redemptions`. Placeholder until the backend publishes a contract for
 * this section — see README "Status". Nothing here invents a response
 * shape; the blurb describes the intended scope so the nav destination
 * isn't a blank guess about what will live here.
 */
export function RedemptionsPage() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Every redemption processed on the marketplace, across all merchants.
      </p>
      <PlaceholderPage title="Redemptions" />
    </div>
  );
}
