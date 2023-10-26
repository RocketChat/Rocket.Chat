import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';

import { Utilities } from '../../../../ee/lib/misc/Utilities';

export const apiCurlGetter =
	(absoluteUrl: (path: string) => string) =>
	(method: string, api: IApiEndpointMetadata): string[] => {
		const example = api.examples?.[method];
		return Utilities.curl({
			url: absoluteUrl(api.computedPath),
			method,
			params: example?.params,
			query: example?.query,
			content: example?.content,
			headers: example?.headers,
			auth: '',
		}).split('\n');
	};
