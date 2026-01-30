import type { IEditedMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Messages, Subscriptions } from '../../../../stores';

export const useUsersNameChanged = () => {
	const notify = useStream('notify-logged');
	const updateMessages = Messages.use((state) => state.update);
	useEffect(() => {
		return notify('Users:NameChanged', ({ _id, name, username }) => {
			updateMessages(
				(record) => record.u._id === _id,
				(record) => ({
					...record,
					u: {
						...record.u,
						username: username ?? record.u.username,
						name,
					},
				}),
			);

			updateMessages(
				(record): record is IEditedMessage => isEditedMessage(record) && record.editedBy?._id === _id,
				(record) => ({
					...record,
					editedBy: {
						...record.editedBy,
						username,
					},
				}),
			);

			updateMessages(
				(record) => record.mentions?.some((mention) => mention._id === _id) ?? false,
				(record) => ({
					...record,
					mentions: record.mentions?.map((mention) => (mention._id === _id ? { ...mention, username, name } : mention)),
				}),
			);

			Subscriptions.state.update(
				(record) => record.name === username && record.t === 'd',
				(record) => ({ ...record, fname: name }),
			);
		});
	}, [notify, updateMessages]);
};
