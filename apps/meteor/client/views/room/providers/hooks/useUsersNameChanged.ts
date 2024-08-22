import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Messages, Subscriptions } from '../../../../../app/models/client';

export const useUsersNameChanged = () => {
	const notify = useStream('notify-logged');
	useEffect(() => {
		return notify('Users:NameChanged', ({ _id, name, username }) => {
			Messages.update(
				{
					'u._id': _id,
				},
				{
					$set: {
						'u.username': username,
						'u.name': name,
					},
				},
				{
					multi: true,
				},
			);

			Messages.update(
				{
					'editedBy._id': _id,
				},
				{
					$set: {
						'editedBy.username': username,
					},
				},
				{
					multi: true,
				},
			);

			Messages.update(
				{
					mentions: {
						$elemMatch: { _id },
					},
				},
				{
					$set: {
						'mentions.$.username': username,
						'mentions.$.name': name,
					},
				},
				{
					multi: true,
				},
			);

			Subscriptions.update(
				{
					name: username,
					t: 'd',
				},
				{
					$set: {
						fname: name,
					},
				},
			);
		});
	}, [notify]);
};
