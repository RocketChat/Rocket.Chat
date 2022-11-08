import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Button, Icon } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useRoomIcon } from '../../../../hooks/useRoomIcon';

type RoomHeaderProps = {
	room: ISubscription & IRoom;
	messagesCount: number;
	isUnread: boolean;
	handleToggleRead: (rid: string) => void;
};

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

	const icon = useRoomIcon(room);

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
					<Header.Icon icon={icon} />
					<Header.Title is='h1'>{room.name}</Header.Title>
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
					<Button
						onClick={(): void => {
							handleToggleRead(room.rid);
						}}
					>
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

export default memo(UnreadAccordionHeader);
