import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useRoomIcon } from '../../../../hooks/useRoomIcon';

const AccordionHeader: FC<{ room: any }> = ({ room }) => {
	const t = useTranslation();
	const icon = useRoomIcon(room);

	return (
		<Header borderBlockStyle='unset'>
			<Header.Avatar>
				<RoomAvatar room={room} />
			</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					<Header.Icon icon={icon} />
					<Header.Title is='h1'>{room?.fname ? room.fname : room.name}</Header.Title>
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle is='h2'>
						<MarkdownText
							parseEmoji={true}
							variant='inlineWithoutBreaks'
							withTruncatedText
							content={t('Total_unreads').replace('{messages}', room?.unread + (room?.tunread?.length || 0))}
						/>
					</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
		</Header>
	);
};

export default AccordionHeader;
