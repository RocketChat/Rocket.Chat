import type { ServerMethodName, ServerMethodParameters, ServerMethodReturn } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

export const call = <M extends ServerMethodName>(method: M, ...params: ServerMethodParameters<M>): Promise<ServerMethodReturn<M>> =>
	new Promise((resolve, reject) => {
		Meteor.call(method, ...params, (error: Error, result: ServerMethodReturn<M>) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	});
