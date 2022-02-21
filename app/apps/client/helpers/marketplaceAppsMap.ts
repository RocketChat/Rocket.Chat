export const marketplaceAppsMap = (appsOverviews: any): any =>
	appsOverviews.map(({ latest, price, pricingPlans, purchaseType, isEnterpriseOnly, modifiedAt }) => ({
		...latest,
		price,
		pricingPlans,
		purchaseType,
		isEnterpriseOnly,
		modifiedAt,
	}));
