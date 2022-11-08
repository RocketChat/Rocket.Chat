import type { IRoom, ISubscription, RoomType } from '@rocket.chat/core-typings';
import { Button, Icon } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

// import RoomAvatar from '../../../components/avatar/RoomAvatar';
import MarkdownText from '../../../../components/MarkdownText';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import RoomTitle from './RoomTitle';

// import MarkdownText from '../../../components/MarkdownText';
// import ParentRoomWithData from './ParentRoomWithData';
// import ParentTeam from './ParentTeam';
// import ToolBox from './ToolBox';
// import Encrypted from './icons/Encrypted';
// import Favorite from './icons/Favorite';
// import Translate from './icons/Translate';

// export type RoomHeaderProps = {
// 	room: IRoom;
// 	topic?: string;
// 	slots: {
// 		start?: unknown;
// 		preContent?: unknown;
// 		insideContent?: unknown;
// 		posContent?: unknown;
// 		end?: unknown;
// 		toolbox?: {
// 			pre?: unknown;
// 			content?: unknown;
// 			pos?: unknown;
// 		};
// 	};
// };
export type RoomHeaderProps = {
	room: ISubscription & IRoom & RoomType;
	messagesCount: number;
	isUnread: boolean;
	handleToggleRead: (rid: string) => void;
};

// const UnreadsRoomHeader: FC<RoomHeaderProps> = ({ room, topic = '', slots = {} }) => {
const UnreadAccordionHeader: FC<RoomHeaderProps> = ({ room, messagesCount, isUnread, handleToggleRead }) => {
	const slots = {
		start: true,
		preContent: true,
		insideContent: true,
		posContent: true,
		end: true,
		toolbox: {
			pre: true,
			content: true,
			pos: true,
		},
	};

	console.log('UnreadAccordionHeader');

	const t = useTranslation();
	return (
		<Header>
			{slots?.start}
			<Header.Avatar>
				<RoomAvatar room={room} />
			</Header.Avatar>
			{slots?.preContent}
			<Header.Content>
				<Header.Content.Row>
					<RoomTitle room={room} />
					{/* <Favorite room={room} /> */}
					{/* {room.prid && <ParentRoomWithData room={room} />} */}
					{/* {room.teamId && !room.teamMain && <ParentTeam room={room} />} */}
					{/* <Encrypted room={room} /> */}
					{/* <Translate room={room} /> */}
					{slots?.insideContent}
				</Header.Content.Row>
				{messagesCount && (
					<Header.Content.Row>
						<Header.Subtitle is='h2'>
							<MarkdownText
								parseEmoji={true}
								variant='inlineWithoutBreaks'
								withTruncatedText
								content={`${messagesCount} unread ${messagesCount === 1 ? 'message' : 'messages'}`}
							/>
						</Header.Subtitle>
					</Header.Content.Row>
				)}
			</Header.Content>
			{slots?.posContent}
			<Header.ToolBox aria-label={t('Toolbox_room_actions')}>
				{slots?.toolbox?.pre}
				{slots?.toolbox?.content}
				{messagesCount > 0 && (
					<Button onClick={() => handleToggleRead(room.rid)}>
						<Icon name={'flag'} size='x20' margin='4x' />
						<span style={{ marginLeft: '10px' }}>{isUnread ? 'Mark Read' : 'Mark Unread'}</span>
					</Button>
				)}
				{slots?.toolbox?.pos}
			</Header.ToolBox>
			{slots?.end}
		</Header>
	);
};

export default UnreadAccordionHeader;
