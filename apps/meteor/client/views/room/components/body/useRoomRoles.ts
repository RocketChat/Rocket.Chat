import { IRoom } from '@rocket.chat/core-typings';
import { useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { RoomRoles, ChatMessage } from '../../../../../app/models/client';

export const useRoomRoles = (rid: IRoom['_id']): void => {
	const queryClient = useQueryClient();
	const getRoomRoles = useMethod('getRoomRoles');
	const dispatchToastMessage = useToastMessageDispatch();

	useEffect(() => {
		queryClient
			.fetchQuery({
				queryKey: ['room', rid, 'roles'],
				queryFn: () => getRoomRoles(rid),
				staleTime: 15_000,
			})
			.then((results) => {
				Array.from(results).forEach(({ _id, ...data }) => {
					const {
						rid,
						u: { _id: uid },
					} = data;
					RoomRoles.upsert({ rid, 'u._id': uid }, data);
				});
			})
			.catch((error) => {
				dispatchToastMessage({ type: 'error', message: error });
			});

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
	}, [dispatchToastMessage, getRoomRoles, queryClient, rid]);
};
