import { Serialized } from '@rocket.chat/core-typings';
import type { MatchPathPattern, OperationParams, OperationResult, PathFor } from '@rocket.chat/rest-typings';

import { APIClient } from '../../../app/utils/client/lib/RestApiClient';

export const getFromRestApi =
	<TPath extends PathFor<'GET'>>(endpoint: TPath) =>
	async (
		params: void extends OperationParams<'GET', MatchPathPattern<TPath>>
			? void
			: Serialized<OperationParams<'GET', MatchPathPattern<TPath>>>,
	): Promise<Serialized<OperationResult<'GET', MatchPathPattern<TPath>>>> => {
		const response = await APIClient.get(endpoint.replace(/^\/+/, ''), params);

		if (typeof response === 'string') {
			throw new Error('invalid response data type');
		}

		return response;
	};
