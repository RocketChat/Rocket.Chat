import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ui-contexts';

import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { dispatchToastMessage } from '../toast';

export const callWithErrorHandling = async <M extends ServerMethodName>(
	method: M,
	...params: ServerMethodParameters<M>
): Promise<ServerMethodReturn<M>> => {
	try {
		return await sdk.call(method, ...params);
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
		throw error;
	}
};
