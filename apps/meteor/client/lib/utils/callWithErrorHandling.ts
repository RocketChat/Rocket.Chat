import { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ui-contexts';

import { dispatchToastMessage } from '../toast';
import { call } from './call';

export const callWithErrorHandling = async <M extends ServerMethodName>(
	method: M,
	...params: ServerMethodParameters<M>
): Promise<ServerMethodReturn<M>> => {
	try {
		return await call(method, ...params);
	} catch (error) {
		dispatchToastMessage({ type: 'error', message: error });
		throw error;
	}
};
