import { Button, Icon } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useRoomIcon } from '../../../../hooks/useRoomIcon';
import { headerRoomData } from './headerRoomData';

type RoomHeaderProps = {
	isAllUnread: boolean;
	totalUnread: number;
	totalThreads: number;
	handleToggleReadAll: () => void;
};

const RoomHeader: FC<RoomHeaderProps> = ({ totalUnread, totalThreads, isAllUnread, handleToggleReadAll }) => {
	const t = useTranslation();
	const icon = useRoomIcon(headerRoomData);

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
				<RoomAvatar room={headerRoomData} />
			</Header.Avatar>
			{slots?.preContent}
			<Header.Content>
				<Header.Content.Row>
					<Header.Icon icon={icon} />
					<Header.Title is='h1'>{headerRoomData.name}</Header.Title>
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
					<Button onClick={(): void => handleToggleReadAll()}>
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

export default memo(RoomHeader);
