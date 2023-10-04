export type BillingEndpoints = {
	'/v1/billing.checkoutUrl': {
		GET: () => { url: string };
	};
};
