import { type ExtendedFetchOptions, Response, serverFetch } from '@rocket.chat/server-fetch';

import { isTesting } from './isTesting';

export class MarketplaceAPIClient {
	#fetchStrategy: (input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean) => Promise<Response>;

	#marketplaceUrl: string;

	constructor() {
		if (typeof process.env.OVERWRITE_INTERNAL_MARKETPLACE_URL === 'string' && process.env.OVERWRITE_INTERNAL_MARKETPLACE_URL !== '') {
			this.#marketplaceUrl = process.env.OVERWRITE_INTERNAL_MARKETPLACE_URL;
		} else {
			this.#marketplaceUrl = 'https://marketplace.rocket.chat';
		}

		if (isTesting()) {
			this.#fetchStrategy = mockMarketplaceFetch;
		} else {
			this.#fetchStrategy = serverFetch;
		}
	}

	public getMarketplaceUrl(): string {
		return this.#marketplaceUrl;
	}

	public setStrategy(strategyName: 'default' | 'mock'): void {
		switch (strategyName) {
			case 'default':
				this.#fetchStrategy = serverFetch;
				break;

			case 'mock':
				this.#fetchStrategy = mockMarketplaceFetch;
				break;

			default:
				throw new Error('Unknown strategy');
		}
	}

	public fetch(input: string, options?: ExtendedFetchOptions, allowSelfSignedCerts?: boolean): ReturnType<typeof serverFetch> {
		if (!input.startsWith('http://') && !input.startsWith('https://')) {
			input = this.getMarketplaceUrl().concat(!input.startsWith('/') ? '/' : '', input);
		}

		return this.#fetchStrategy(input, options, allowSelfSignedCerts);
	}
}

/**
 * Mocked fetch for marketplace related APIs
 * This allows us to prevent actual calls to Marketplace service
 * during TEST_MODE (CI, local tests, etc.), i.e., remove our dependency
 * an external unrelated service
 */
function mockMarketplaceFetch(input: string, _options?: ExtendedFetchOptions, _allowSelfSignedCerts?: boolean): Promise<Response> {
	let content: string;

	switch (true) {
		case input.indexOf('v1/apps') !== -1:
		case input.indexOf('v1/categories') !== -1:
			content = '[]';
			break;
		default:
			throw new Error(`Uncovered input ${input}`);
	}

	const response = new Response(Buffer.from(content), {
		headers: {
			'content-type': 'application/json',
		},
	});

	return Promise.resolve(response);
}
