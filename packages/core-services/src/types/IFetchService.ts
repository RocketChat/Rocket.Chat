import type { fetch as nodeFetch } from 'meteor/fetch';

import type { IServiceClass } from './ServiceClass';

export interface IFetchService extends IServiceClass {
	fetch(
		input: string,
		options?: Parameters<typeof nodeFetch>[1] & { compress?: boolean; follow?: number; size?: number },
		allowSelfSignedCerts?: boolean,
	): Promise<Response>;
}
