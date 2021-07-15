import { useCallback, useEffect } from 'react';

import { ILivechatTag } from '../../../../../../../definition/ILivechatTag';
import { IOmnichannelRoom } from '../../../../../../../definition/IRoom';
import { ObjectFromApi } from '../../../../../../../definition/ObjectFromApi';
import { useEndpoint } from '../../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../../contexts/ToastMessagesContext';
import { AsyncState, useAsyncState } from '../../../../../../hooks/useAsyncState';

export const useRoomEditData = (
	id: IOmnichannelRoom['_id'],
): AsyncState<{ room: IOmnichannelRoom; tags: ObjectFromApi<ILivechatTag>[] }> => {
	const { resolve, reject, reset, ...state } =
		useAsyncState<{ room: IOmnichannelRoom; tags: ObjectFromApi<ILivechatTag>[] }>();
	const dispatchToastMessage = useToastMessageDispatch();
	const getRoomData = useEndpoint('GET', 'rooms.info');
	const getTagsData = useEndpoint('GET', 'livechat/tags.list');

	const fetchData = useCallback(() => {
		reset();
		getRoomData({ roomId: id })
			.then(({ room }) => {
				getTagsData({ departmentId: room.departmentId })
					.then(({ tags }) => {
						resolve({ room, tags });
					})
					.catch((error) => {
						console.error(error);
						dispatchToastMessage({
							type: 'error',
							message: error,
						});
						reject(error);
					});
			})
			.catch((error) => {
				console.error(error);
				dispatchToastMessage({
					type: 'error',
					message: error,
				});
				reject(error);
			});
	}, [reset, getRoomData, id, getTagsData, resolve, dispatchToastMessage, reject]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		...state,
	};
};
