import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import {
	Header,
	HeaderAvatar,
	HeaderContent,
	HeaderContentRow,
	HeaderSection,
	HeaderSubtitle,
	HeaderToolbar,
} from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { Suspense } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import FederatedRoomOriginServer from './FederatedRoomOriginServer';
import ParentRoomWithData from './ParentRoomWithData';
import ParentTeam from './ParentTeam';
import { RoomLeader } from './RoomLeader';
import RoomTitle from './RoomTitle';
import RoomToolbox from './RoomToolbox';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';

export type RoomHeaderProps = {
	room: IRoom;
	topic?: string;
	roomLeader?:
		| {
				name: string | undefined;
				_id: string;
				username?: string | undefined;
		  }
		| null
		| undefined;
	slots: {
		start?: unknown;
		preContent?: unknown;
		insideContent?: unknown;
		posContent?: unknown;
		end?: unknown;
		toolbox?: {
			pre?: unknown;
			content?: unknown;
			pos?: unknown;
		};
	};
};

const RoomHeader = ({ room, topic = '', slots = {}, roomLeader }: RoomHeaderProps) => {
	const t = useTranslation();

	return (
		<Header>
			<HeaderSection>
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
						{slots?.toolbox?.content || <RoomToolbox />}
						{slots?.toolbox?.pos}
					</HeaderToolbar>
				</Suspense>
				{slots?.end}
			</HeaderSection>
			{(topic || roomLeader) && (
				<HeaderSection>
					<HeaderContentRow>
						<HeaderSubtitle is='h2' flexGrow={1}>
							<MarkdownText parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />
						</HeaderSubtitle>
						{roomLeader && <RoomLeader {...roomLeader} />}
					</HeaderContentRow>
				</HeaderSection>
			)}
		</Header>
	);
};

export default RoomHeader;
