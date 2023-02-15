import type { IFetchService } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import { fetch } from '../../lib/http/fetch';

export class FetchService extends ServiceClassInternal implements IFetchService {
	protected name = 'fetch';

	async fetch(
		input: string,
		options?: (RequestInit & { compress?: boolean | undefined; follow?: number | undefined; size?: number | undefined }) | undefined,
		allowSelfSignedCerts?: boolean | undefined,
	): Promise<Response> {
		return fetch(input, options, allowSelfSignedCerts);
	}
}
