import type { IRoom } from '@rocket.chat/core-typings';
import React, { FC } from 'react';

import Header from '../../../components/Header';
import MarkdownText from '../../../components/MarkdownText';
import RoomAvatar from '../../../components/avatar/RoomAvatar';
import ParentRoomWithData from './ParentRoomWithData';
import ParentTeam from './ParentTeam';
import RoomTitle from './RoomTitle';
import ToolBox from './ToolBox';
import Encrypted from './icons/Encrypted';
import Favorite from './icons/Favorite';
import Translate from './icons/Translate';

export type RoomHeaderProps = {
	room: IRoom;
	topic?: string;
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

const RoomHeader: FC<RoomHeaderProps> = ({ room, topic = '', slots = {} }) => (
	<Header>
		{slots?.start}
		<Header.Avatar>
			<RoomAvatar room={room} />
		</Header.Avatar>
		{slots?.preContent}
		<Header.Content>
			<Header.Content.Row>
				<RoomTitle room={room} />
				<Favorite room={room} />
				{room.prid && <ParentRoomWithData room={room} />}
				{room.teamId && !room.teamMain && <ParentTeam room={room} />}
				<Encrypted room={room} />
				<Translate room={room} />
				{slots?.insideContent}
			</Header.Content.Row>
			<Header.Content.Row>
				<Header.Subtitle>
					{topic && <MarkdownText parseEmoji={true} variant='inlineWithoutBreaks' withTruncatedText content={topic} />}
				</Header.Subtitle>
			</Header.Content.Row>
		</Header.Content>
		{slots?.posContent}
		<Header.ToolBox>
			{slots?.toolbox?.pre}
			{slots?.toolbox?.content || <ToolBox room={room} />}
			{slots?.toolbox?.pos}
		</Header.ToolBox>
		{slots?.end}
	</Header>
);

export default RoomHeader;
