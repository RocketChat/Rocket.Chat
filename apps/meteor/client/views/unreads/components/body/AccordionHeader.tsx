import { Header } from '@rocket.chat/ui-client';
import React, { FC } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useRoomIcon } from '../../../../hooks/useRoomIcon';

const AccordionHeader: FC<{ room: any }> = ({ room }) => {
	const icon = useRoomIcon(room);

	const threadsText = room.threads.length === 1 ? ` and ${room.threads.length} thread` : ` and ${room.threads.length} threads`;

	return (
		<Header borderBlockStyle='unset'>
			<Header.Avatar>
				<RoomAvatar room={room} />
			</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					<Header.Icon icon={icon} />
					<Header.Title is='h1'>{room.name}</Header.Title>
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle is='h2'>
						<MarkdownText
							parseEmoji={true}
							variant='inlineWithoutBreaks'
							withTruncatedText
							content={`Total ${room.messages.length} unread messages ${room.threads.length > 0 ? threadsText : ''}`}
						/>
					</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
		</Header>
	);
};

export default AccordionHeader;
