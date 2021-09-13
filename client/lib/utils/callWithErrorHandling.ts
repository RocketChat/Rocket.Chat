import { handleError } from '../../../app/utils/client/lib/handleError';
import {
	ServerMethodName,
	ServerMethodParameters,
	ServerMethodReturn,
} from '../../contexts/ServerContext';
import { call } from './call';

export const callWithErrorHandling = async <M extends ServerMethodName>(
	method: M,
	...params: ServerMethodParameters<M>
): Promise<ServerMethodReturn<M>> => {
	try {
		return await call(method, ...params);
	} catch (error) {
		handleError(error);
		throw error;
	}
};
