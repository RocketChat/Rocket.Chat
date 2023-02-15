import type { IMessage } from '@rocket.chat/core-typings';
import _ from 'underscore';

import { callWithErrorHandling } from '../../../client/lib/utils/callWithErrorHandling';
import { Messages } from '../../models/client';

export const findParentMessage = (() => {
	const waiting: string[] = [];
	let resolve: (value: IMessage[] | PromiseLike<IMessage[]>) => Promise<IMessage[] | PromiseLike<IMessage[]>>;
	let pending = new Promise<IMessage[]>((r) => {
		resolve = r as any;
	});

	const getMessages = _.debounce(async function () {
		const _tmp = [...waiting];
		waiting.length = 0;
		resolve(callWithErrorHandling('getMessages', _tmp));
		pending = new Promise<IMessage[]>((r) => {
			resolve = r as any;
		});
	}, 500);

	const get = async (tmid: string) => {
		getMessages();
		const messages = await pending;
		return messages.find(({ _id }) => _id === tmid);
	};

	return async (tmid: string) => {
		const message = Messages.findOne({ _id: tmid });

		if (message) {
			return message;
		}

		if (waiting.indexOf(tmid) === -1) {
			waiting.push(tmid);
		}
		return get(tmid);
	};
})();
