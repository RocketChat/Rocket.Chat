export class MarketplaceAppsError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class MarketplaceConnectionError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class MarketplaceUnsupportedVersionError extends Error {
	constructor() {
		super('Marketplace_Unsupported_Version');
	}
}
