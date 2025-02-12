export class MarketplaceAppsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MarketplaceAppsError';
	}
}

export class MarketplaceConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MarketplaceConnectionError';
	}
}
