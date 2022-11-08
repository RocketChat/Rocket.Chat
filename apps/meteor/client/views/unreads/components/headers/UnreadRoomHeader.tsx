import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
// import { Badge, Button, Icon } from '@rocket.chat/fuselage';
import { Button, Icon } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
// import { useTranslation } from '@rocket.chat/ui-contexts';
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
type RoomHeaderProps = {
	room: ISubscription & IRoom;
	isAllUnread: boolean;
	totalUnread: number;
	totalThreads: number;
	handleToggleReadAll: () => void;
};

// type HeaderProps<T> = {
// 	room: T;
// };

// const Header = ({ room }: HeaderProps<IRoom >): ReactElement  => {

// const UnreadRoomHeader = ({ room, totalUnread, isAllUnread, topic='', handleToggleReadAll }: RoomHeaderProps): ReactElement => {
const UnreadRoomHeader: FC<RoomHeaderProps> = ({ room, totalUnread, totalThreads, isAllUnread, handleToggleReadAll }) => {
	const t = useTranslation();

	// const badgeStyle = {
	// 	backgroundColor: isAllUnread ? '#ff0000' : '#1c860e',
	// 	color: 'var(--rcx-color-surface, white)',
	// 	flexShrink: 0,
	// };

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

	const threadsText = totalThreads === 1 ? ` and ${totalThreads} thread` : ` and ${totalThreads} threads`;

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
					{slots?.insideContent}
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle is='h2'>
						<MarkdownText
							parseEmoji={true}
							variant='inlineWithoutBreaks'
							withTruncatedText
							content={`Total ${totalUnread} unread messages ${totalThreads > 0 ? threadsText : ''}`}
						/>
					</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			{slots?.posContent}
			<Header.ToolBox aria-label={t('Toolbox_room_actions')}>
				{slots?.toolbox?.pre}
				{slots?.toolbox?.content}
				{totalUnread > 0 && (
					<Button onClick={() => handleToggleReadAll()}>
						<Icon name={'flag'} size='x20' margin='4x' />
						<span style={{ marginLeft: '10px' }}>{isAllUnread ? `Mark All Read` : 'Mark All Unread'}</span>
					</Button>
				)}
				{slots?.toolbox?.pos}
			</Header.ToolBox>
			{slots?.end}
		</Header>
	);
};

export default UnreadRoomHeader;
