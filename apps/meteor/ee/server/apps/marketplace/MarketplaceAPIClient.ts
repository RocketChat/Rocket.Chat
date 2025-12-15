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
 * Provide mocked HTTP responses for supported Marketplace API endpoints.
 *
 * This allows us to prevent actual calls to Marketplace service
 * during TEST_MODE (CI, local tests, etc.), i.e., remove our dependency
 * an external unrelated service
 *
 * The response content provided has minimal structure to allow for the program
 * to not crash by receiving something different from the expected structure
 *
 * @param input - The request URL or path used to determine which mock response to return
 * @returns A `Response` with status 200 and a JSON body corresponding to the requested marketplace endpoint
 * @throws Error when `input` does not match any supported mock endpoint
 */
function mockMarketplaceFetch(input: string, _options?: ExtendedFetchOptions, _allowSelfSignedCerts?: boolean): Promise<Response> {
	let content: string;

	switch (true) {
		// This is not an exhaustive list of endpoints
		case input.indexOf('v1/apps') !== -1:
		case input.indexOf('v1/categories') !== -1:
		case input.indexOf('v1/bundles') !== -1:
			content = '[]';
			break;
		case input.indexOf('v1/featured-apps') !== -1:
			content = '{"sections":[]}';
			break;
		case input.indexOf('v1/app-request/stats') !== -1:
			content = '{"data":{"totalSeen":0,"totalUnseen":0}}';
			break;
		case input.indexOf('v1/app-request/markAsSeen') !== -1:
			content = '{"success":false}';
			break;
		case input.indexOf('v1/app-request') !== -1:
			content = '{"data":[],"meta":{"limit":25,"offset":0,"sort":"","filter":"","total":0}}';
			break;
		case input.indexOf('v1/workspaces') !== -1:
			content = '{}';
			break;
		default:
			throw new Error(`Invalid marketplace mock request ${input}`);
	}

	const response = new Response(Buffer.from(content), {
		headers: {
			'content-type': 'application/json',
		},
		status: 200,
	});

	return Promise.resolve(response);
}
