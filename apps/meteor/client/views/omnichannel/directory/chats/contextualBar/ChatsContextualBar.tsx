import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import VerticalBar from '../../../../../components/VerticalBar';
import { useTabBarClose } from '../../../../room/contexts/ToolboxContext';
import ChatInfo from './ChatInfo';
import { RoomEditWithData } from './RoomEdit';

const PATH = 'live';

const HEADER_DATA = {
	info: { icon: 'info-circled', title: 'Room_Info' },
	edit: { icon: 'pencil', title: 'edit-room' },
} as const;

type ChatsContextualBarProps = {
	rid: string;
};

const ChatsContextualBar = ({ rid }: ChatsContextualBarProps) => {
	const t = useTranslation();

	const context = useRouteParameter('context') as 'edit' | 'info' | undefined;
	const directoryRoute = useRoute(PATH);
	const closeContextualBar = useTabBarClose();

	const handleRoomEditBarCloseButtonClick = () => {
		directoryRoute.push({ id: rid, tab: 'room-info' });
	};

	const { icon, title } = useMemo(() => HEADER_DATA[context ?? 'info'] || HEADER_DATA.info, [context]);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name={icon} />
				<VerticalBar.Text>{t(title)}</VerticalBar.Text>

				<VerticalBar.Close onClick={closeContextualBar} />
			</VerticalBar.Header>

			{context === 'edit' ? <RoomEditWithData id={rid} onClose={handleRoomEditBarCloseButtonClick} /> : <ChatInfo route={PATH} id={rid} />}
		</>
	);
};

export default ChatsContextualBar;
