import React, { useState, useCallback, useEffect } from 'react';
import { useMutableCallback, useLocalStorage, useDebouncedState } from '@rocket.chat/fuselage-hooks';

import { ENDPOINT_STATES, useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import { useUserId, useUserRoom } from '../../contexts/UserContext';
import RoomFiles from '../../components/RoomFiles/RoomFiles';
import DeleteFileWarning from '../../components/DeleteFileWarning';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useMethod } from '../../contexts/ServerContext';

export default ({ rid, tabBar }) => {
	const onClickClose = useMutableCallback(() => tabBar && tabBar.close());
	const userId = useUserId();
	const room = useUserRoom(rid);
	room.type = room.t;
	room.rid = rid;

	const setModal = useSetModal();
	const closeModal = useMutableCallback(() => setModal());
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteFile = useMethod('deleteFileMessage');

	const [type, setType] = useLocalStorage('file-list-type', 'all');
	const [text, setText] = useState('');

	const [query, setQuery] = useDebouncedState({
		roomId: rid,
		query: JSON.stringify({
			...type !== 'all' && {
				typeGroup: type,
			},
		}),
	}, 500);

	const handleTextChange = useCallback((event) => {
		setText(event.currentTarget.value);
	}, []);

	useEffect(() => setQuery({
		roomId: rid,
		query: JSON.stringify({
			name: { $regex: text || '', $options: 'i' },
			...type !== 'all' && {
				typeGroup: type,
			},
		}),
	}), [rid, text, type, setQuery]);

	const { data, state, reload } = useEndpointDataExperimental(room.type === 'c' ? 'channels.files' : 'groups.files', query);

	const handleDelete = useMutableCallback((_id) => {
		const onConfirm = async () => {
			try {
				await deleteFile(_id);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
			reload();
		};

		setModal(<DeleteFileWarning onConfirm={onConfirm} onCancel={closeModal} />);
	});

	return (
		<RoomFiles
			userId={userId}
			loading={state === ENDPOINT_STATES.LOADING && true}
			type={type}
			text={text}
			setType={setType}
			setText={handleTextChange}
			filesItems={state === ENDPOINT_STATES.DONE && data.files}
			onClickClose={onClickClose}
			onClickDelete={handleDelete}
		/>
	);
};
