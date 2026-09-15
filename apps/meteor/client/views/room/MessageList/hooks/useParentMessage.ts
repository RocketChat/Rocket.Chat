import type { IMessage } from '@rocket.chat/core-typings';
import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { withDebouncing } from '../../../../../lib/utils/highOrderFunctions';
import { sdk } from '../../../../lib/SDKClient';
import { mapMessageFromApi } from '../../../../lib/utils/mapMessageFromApi';
import { Messages } from '../../../../stores';

const MAX_IDS_PER_REQUEST = 100;

const findParentMessage = (() => {
	const waiting: string[] = [];
	let resolve: (resolved: IMessage[] | PromiseLike<IMessage[]>) => void;
	let pending = new Promise<IMessage[]>((r) => {
		resolve = r;
	});

	const getMessages = withDebouncing({ wait: 500 })(async () => {
		const messageIds = [...waiting];
		waiting.length = 0;

		const batches: string[][] = [];
		for (let i = 0; i < messageIds.length; i += MAX_IDS_PER_REQUEST) {
			batches.push(messageIds.slice(i, i + MAX_IDS_PER_REQUEST));
		}

		resolve(
			Promise.all(
				batches.map((ids) =>
					sdk.rest.post('/v1/chat.getMessages', { messageIds: ids }).then(({ messages }) => messages.map((msg) => mapMessageFromApi(msg))),
				),
			).then((results) => results.flat()),
		);

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
