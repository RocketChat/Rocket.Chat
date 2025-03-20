import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

import FederatedRoomOriginServer from './FederatedRoomOriginServer';
import ParentRoomWithData from './ParentRoomWithData';
import ParentTeam from './ParentTeam';
import RoomTitle from './RoomTitle';
import RoomToolbox from './RoomToolbox';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';
import { Header, HeaderAvatar, HeaderContent, HeaderContentRow, HeaderToolbar } from '../../../components/Header';

export type RoomHeaderProps = {
	room: IRoom;
	slots: {
		start?: ReactNode;
		preContent?: ReactNode;
		insideContent?: ReactNode;
		posContent?: ReactNode;
		end?: ReactNode;
		toolbox?: {
			pre?: ReactNode;
			content?: ReactNode;
			pos?: ReactNode;
		};
	};
	roomToolbox?: JSX.Element;
};

const RoomHeader = ({ room, slots = {}, roomToolbox }: RoomHeaderProps) => {
	const { t } = useTranslation();

	return (
		<Header>
			{slots?.start}
			<HeaderAvatar>
				<RoomAvatar room={room} size='x28' />
			</HeaderAvatar>
			{slots?.preContent}
			<HeaderContent>
				<HeaderContentRow>
					<RoomTitle room={room} />
					<Favorite room={room} />
					{room.prid && <ParentRoomWithData room={room} />}
					{room.teamId && !room.teamMain && <ParentTeam room={room} />}
					{isRoomFederated(room) && <FederatedRoomOriginServer room={room} />}
					<Encrypted room={room} />
					<Translate room={room} />
					{slots?.insideContent}
				</HeaderContentRow>
			</HeaderContent>
			{slots?.posContent}
			<Suspense fallback={null}>
				<HeaderToolbar aria-label={t('Toolbox_room_actions')}>
					{slots?.toolbox?.pre}
					{slots?.toolbox?.content || roomToolbox || <RoomToolbox />}
					{slots?.toolbox?.pos}
				</HeaderToolbar>
			</Suspense>
			{slots?.end}
		</Header>
	);
};

export default RoomHeader;
