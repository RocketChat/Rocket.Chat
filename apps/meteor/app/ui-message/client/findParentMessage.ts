import type { IMessage } from '@rocket.chat/core-typings';

import { callWithErrorHandling } from '../../../client/lib/utils/callWithErrorHandling';
import { withDebouncing } from '../../../lib/utils/highOrderFunctions';
import { ChatMessage } from '../../models/client';

export const findParentMessage = (() => {
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
		return messages.find(({ _id }) => _id === tmid);
	};

	return async (tmid: IMessage['_id']) => {
		const message = ChatMessage.findOne({ _id: tmid });

		if (message) {
			return message;
		}

		if (waiting.indexOf(tmid) === -1) {
			waiting.push(tmid);
		}
		return get(tmid);
	};
})();
