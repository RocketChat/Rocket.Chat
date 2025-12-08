import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
} from '@rocket.chat/ui-client';
import { useRoute, useRouteParameter, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatInfo from './ChatInfo';
import RoomEdit from './RoomEdit';
import { useRoom } from '../../../../room/contexts/RoomContext';

const PATH = 'live';

const HEADER_DATA = {
	info: { icon: 'info-circled', title: 'Room_Info' },
	edit: { icon: 'pencil', title: 'edit-room' },
} as const;

const ChatsContextualBar = () => {
	const { t } = useTranslation();

	const context = useRouteParameter('context') as 'edit' | 'info' | undefined;
	const directoryRoute = useRoute(PATH);
	const room = useRoom();
	const { closeTab } = useRoomToolbox();

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: room._id, tab: 'room-info' });
	};

	const { icon, title } = useMemo(() => HEADER_DATA[context ?? 'info'] || HEADER_DATA.info, [context]);

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				<ContextualbarIcon name={icon} />
				<ContextualbarTitle>{t(title)}</ContextualbarTitle>
				<ContextualbarClose onClick={closeTab} />
			</ContextualbarHeader>
			{context === 'edit' ? (
				<RoomEdit id={room._id} onClose={handleRoomEditBarCloseButtonClick} />
			) : (
				<ChatInfo route={PATH} id={room._id} />
			)}
		</ContextualbarDialog>
	);
};

export default ChatsContextualBar;
