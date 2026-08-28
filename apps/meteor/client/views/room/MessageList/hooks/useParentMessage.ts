import type { IMessage } from '@rocket.chat/core-typings';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { withDebouncing } from '../../../../../lib/utils/highOrderFunctions';
import { callWithErrorHandling } from '../../../../lib/utils/callWithErrorHandling';
import { Messages } from '../../../../stores';

const findParentMessage = (() => {
	const waiting: string[] = [];
	let resolve: (resolved: IMessage[] | PromiseLike<IMessage[]>) => void;
	let pending = new Promise<IMessage[]>((r) => {
		resolve = r;
	});

	const getMessages = withDebouncing({ wait: 500 })(async () => {
		const _tmp = [...waiting];
		waiting.length = 0;
		resolve(callWithErrorHandling('getMessages', _tmp));
		pending = new Promise<IMessage[]>((r) => {
			resolve = r;
		});
	});

	const get = async (tmid: IMessage['_id']) => {
		void getMessages();
		const messages = await pending;
		const message = messages.find(({ _id }) => _id === tmid);

		if (!message) {
			throw new Error(`Message ${tmid} not found`);
		}

		return message;
	};

	return async (tmid: IMessage['_id']) => {
		const message = Messages.state.get(tmid);

		if (message) {
			return message;
		}

		if (waiting.indexOf(tmid) === -1) {
			waiting.push(tmid);
		}
		return get(tmid);
	};
})();

export const useParentMessage = (mid: IMessage['_id']): UseQueryResult<IMessage> =>
	useQuery({
		queryKey: ['parent-message', { mid }],
		queryFn: async () => findParentMessage(mid),
	});
