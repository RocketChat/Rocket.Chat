import { ChangeEvent } from 'mongodb';

import { normalize } from './utils';
import { IUser } from '../../../../definition/IUser';
import { api } from '../../../../server/sdk/api';

function nestStringProperties(obj: object): object {
	if (!obj) {
		return {};
	}

	const isPlainObject = (obj: object): boolean => !!obj && obj.constructor === {}.constructor;

	const getNestedObject = (obj: object): object =>
		Object.entries(obj).reduce<{[k: string]: any}>((result, [prop, val]) => {
			prop.split('.').reduce((nestedResult, prop, propIndex, propArray) => {
				const lastProp = propIndex === propArray.length - 1;
				if (lastProp) {
					nestedResult[prop] = isPlainObject(val) ? getNestedObject(val) : val;
				} else {
					nestedResult[prop] = nestedResult[prop] || {};
				}
				return nestedResult[prop];
			}, result);
			return result;
		}, {});

	return getNestedObject(obj);
}

export async function watchUsers(event: ChangeEvent<IUser>): Promise<void> {
	switch (event.operationType) {
		case 'insert':
		case 'update':
			const { updatedFields } = 'updateDescription' in event ? event.updateDescription : { updatedFields: undefined };
			// const message = await Messages.findOne(documentKey);
			const user = event.fullDocument;

			if (!user) {
				break;
			}

			// Streamer.emitWithoutBroadcast('__my_messages__', message, {});
			if (updatedFields) {
				if (updatedFields.status || updatedFields.statusText) {
					const { status, _id, username, statusText } = user; // remove username
					api.broadcast('userpresence', { action: normalize[event.operationType], user: { status, _id, username, statusText } }); // remove username
					// RocketChat.Logger.info('User: userpresence', { status, _id, username, statusText });
				}

				if (updatedFields.username || updatedFields.name) {
					const { name, username } = updatedFields;
					const { _id } = event.documentKey;
					const nameChange = {
						_id,
						name: name || user.name,
						username: username || user.username,
					};

					api.broadcast('user.name', {
						action: normalize[event.operationType],
						user: nameChange,
					});
					// RocketChat.Logger.info('User: user.name', nameChange);
				}
			}
			api.broadcast('user', {
				action: normalize[event.operationType],
				user: {
					...event.documentKey,
					...updatedFields ? nestStringProperties(updatedFields) : {},
				},
			});
			// RocketChat.Logger.info('User record', user);
			// return Streamer[method]({ stream: STREAM_NAMES['room-messages'], eventName: message.rid, args: message });
			// publishMessage(operationType, message);
	}
}
