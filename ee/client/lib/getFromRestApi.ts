import { APIClient } from '../../../app/utils/client/lib/RestApiClient';
import { Serialized } from '../../../definition/Serialized';
import { Params, PathFor, Return } from '../../../definition/rest';

export const getFromRestApi =
	<P extends PathFor<'GET'>>(endpoint: P) =>
	async (params: Serialized<Params<'GET', P>[0]>): Promise<Serialized<Return<'GET', P>>> => {
		const response = await APIClient.get(endpoint, params);

		if (typeof response === 'string') {
			throw new Error('invalid response data type');
		}

		return response;
	};
