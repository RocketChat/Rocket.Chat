import type { IRole, IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useMethod, useStream } from '@rocket.chat/ui-contexts';
import type { Mongo } from 'meteor/mongo';
import { useEffect } from 'react';

import { RoomRoles, ChatMessage } from '../../../../../app/models/client';

const roomRoles = RoomRoles as Mongo.Collection<Pick<ISubscription, 'rid' | 'u' | 'roles'>>;

export const useRoomRolesManagement = (rid: IRoom['_id']): void => {
	const getRoomRoles = useMethod('getRoomRoles');

	useEffect(() => {
		getRoomRoles(rid).then((results) => {
			Array.from(results).forEach(({ _id, ...data }) => {
				const {
					rid,
					u: { _id: uid },
				} = data;
				roomRoles.upsert({ rid, 'u._id': uid }, data);
			});
		});
	}, [getRoomRoles, rid]);

	useEffect(() => {
		const rolesObserve = RoomRoles.find({ rid }).observe({
			added: (role) => {
				if (!role.u?._id) {
					return;
				}
				ChatMessage.update({ rid, 'u._id': role.u._id }, { $addToSet: { roles: role._id } }, { multi: true });
			},
			changed: (role) => {
				if (!role.u?._id) {
					return;
				}
				ChatMessage.update({ rid, 'u._id': role.u._id }, { $inc: { rerender: 1 } }, { multi: true });
			},
			removed: (role) => {
				if (!role.u?._id) {
					return;
				}
				ChatMessage.update({ rid, 'u._id': role.u._id }, { $pull: { roles: role._id } }, { multi: true });
			},
		});

		return (): void => {
			rolesObserve.stop();
		};
	}, [getRoomRoles, rid]);

	const subscribeToNotifyLoggedIn = useStream('notify-logged');

	useEffect(
		() =>
			subscribeToNotifyLoggedIn(
				'roles-change',
				({
					type,
					...role
				}: {
					type: 'added' | 'removed' | 'changed';
					_id: IRole['_id'];
					u: {
						_id: IUser['_id'];
						username: IUser['username'];
						name: IUser['name'];
					};
					scope?: IRoom['_id'];
				}) => {
					if (!role.scope) {
						return;
					}

					switch (type) {
						case 'added':
							roomRoles.upsert({ 'rid': role.scope, 'u._id': role.u._id }, { $setOnInsert: { u: role.u }, $addToSet: { roles: role._id } });
							break;

						case 'removed':
							RoomRoles.update({ 'rid': role.scope, 'u._id': role.u._id }, { $pull: { roles: role._id } });
							break;
					}
				},
			),
		[subscribeToNotifyLoggedIn],
	);

	useEffect(
		() =>
			subscribeToNotifyLoggedIn('Users:NameChanged', ({ _id: uid, name }: Partial<IUser>) => {
				roomRoles.update(
					{
						'u._id': uid,
					},
					{
						$set: {
							'u.name': name,
						},
					},
					{
						multi: true,
					},
				);
			}),
		[subscribeToNotifyLoggedIn],
	);
};
