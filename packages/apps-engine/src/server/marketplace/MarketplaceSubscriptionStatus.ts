export enum MarketplaceSubscriptionStatus {
    // PurchaseSubscriptionStatusTrialing is when the subscription is in the trial phase
    PurchaseSubscriptionStatusTrialing = 'trialing',
    // PurchaseSubscriptionStatusActive is when the subscription is active and being billed for
    PurchaseSubscriptionStatusActive = 'active',
    // PurchaseSubscriptionStatusCanceled is when the subscription is inactive due to being canceled
    PurchaseSubscriptionStatusCanceled = 'canceled',
    // PurchaseSubscriptionStatusPastDue is when the subscription was active but is now past due as a result of incorrect billing information
    PurchaseSubscriptionStatusPastDue = 'pastDue',
}
