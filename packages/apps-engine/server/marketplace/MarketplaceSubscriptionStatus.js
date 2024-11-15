"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceSubscriptionStatus = void 0;
var MarketplaceSubscriptionStatus;
(function (MarketplaceSubscriptionStatus) {
    // PurchaseSubscriptionStatusTrialing is when the subscription is in the trial phase
    MarketplaceSubscriptionStatus["PurchaseSubscriptionStatusTrialing"] = "trialing";
    // PurchaseSubscriptionStatusActive is when the subscription is active and being billed for
    MarketplaceSubscriptionStatus["PurchaseSubscriptionStatusActive"] = "active";
    // PurchaseSubscriptionStatusCanceled is when the subscription is inactive due to being canceled
    MarketplaceSubscriptionStatus["PurchaseSubscriptionStatusCanceled"] = "canceled";
    // PurchaseSubscriptionStatusPastDue is when the subscription was active but is now past due as a result of incorrect billing information
    MarketplaceSubscriptionStatus["PurchaseSubscriptionStatusPastDue"] = "pastDue";
})(MarketplaceSubscriptionStatus || (exports.MarketplaceSubscriptionStatus = MarketplaceSubscriptionStatus = {}));
//# sourceMappingURL=MarketplaceSubscriptionStatus.js.map