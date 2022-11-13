import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC } from 'react';

import { getAvatarURL } from '../../../../../app/utils/lib/getAvatarURL';
import MarkdownText from '../../../../components/MarkdownText';
import RoomAvatar from '../../../../components/avatar/RoomAvatar';
import { useRoomIcon } from '../../../../hooks/useRoomIcon';
import { IUnreadHistoryRoom } from '../../hooks/useUnreads';

const AccordionHeader: FC<{ room: any; handleRedirect: () => Promise<void>; handleMark: (room: IUnreadHistoryRoom) => Promise<void> }> = ({
	room,
	handleMark,
	handleRedirect,
}) => {
	const t = useTranslation();
	const icon = useRoomIcon(room);
	const defaultUrl = room.prid ? getAvatarURL({ roomId: room.prid }) : getAvatarURL({ username: `@${room.name}` });

	return (
		<Header borderBlockStyle='unset'>
			<Header.Avatar>
				<RoomAvatar url={room?.avatarETag ?? defaultUrl} room={room} />
			</Header.Avatar>
			<Header.Content>
				<Header.Content.Row>
					<Header.Icon icon={icon} />
					<Header.Title is='h1'>{room?.fname ?? room.name}</Header.Title>
				</Header.Content.Row>
				<Header.Content.Row>
					<Header.Subtitle is='h2'>
						<MarkdownText
							parseEmoji={true}
							variant='inlineWithoutBreaks'
							withTruncatedText
							content={(room.undo ? t('Total_reads') : t('Total_unreads')).replace(
								'{messages}',
								room?.unread + (room?.tunread?.length || 0),
							)}
						/>
					</Header.Subtitle>
				</Header.Content.Row>
			</Header.Content>
			{room.undo && (
				<ButtonGroup>
					<Button small onClick={(): Promise<void> => handleRedirect()} backgroundColor='transparent' borderColor='transparent'>
						<Icon name={'reply-directly'} size='x20' margin='4x' />
						<span style={{ marginLeft: '8px' }}>{t('Jump_to')}</span>
					</Button>
					<Button small onClick={(): Promise<void> => handleMark(room)} backgroundColor='transparent' borderColor='transparent'>
						<Icon name={'flag'} size='x20' margin='4x' />
						<span style={{ marginLeft: '10px' }}>{t('Undo')}</span>
					</Button>
				</ButtonGroup>
			)}
		</Header>
	);
};

export default AccordionHeader;
