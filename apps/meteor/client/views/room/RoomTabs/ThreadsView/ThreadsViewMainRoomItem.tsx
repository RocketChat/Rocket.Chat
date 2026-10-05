import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Palette, Tag } from '@rocket.chat/fuselage';
import { RoomAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

import { useRoomName } from '../../../../hooks/useRoomName';
import { getMessagePreview } from '../../../../lib/utils/normalizeMessagePreview/getMessagePreview';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useThreadListTimeAgo } from '../../contextualBar/Threads/hooks/useThreadListTimeAgo';

const itemStyle = css`
	cursor: pointer;
	border: none;
	text-align: start;
	background: transparent;

	&:hover {
		background: ${Palette.surface['surface-hover']};
	}

	&[aria-current='true'] {
		background: ${Palette.surface['surface-selected']};
	}

	&:focus-visible {
		outline: 2px solid ${Palette.stroke['stroke-highlight']};
		outline-offset: -2px;
	}
`;

export type ThreadsViewMainRoomItemProps = {
	selected: boolean;
	onClick: () => void;
};

const ThreadsViewMainRoomItem = ({ selected, onClick }: ThreadsViewMainRoomItemProps) => {
	const { t } = useTranslation();
	const room = useRoom();
	const subscription = useRoomSubscription();
	const roomName = useRoomName(room);
	const formatDate = useThreadListTimeAgo();

	const { lastMessage } = room;
	const preview = getMessagePreview({ ...subscription, t: room.t, uids: room.uids }, lastMessage, t);

	return (
		<Box
			is='button'
			type='button'
			className={itemStyle}
			aria-current={selected}
			onClick={onClick}
			display='flex'
			alignItems='center'
			width='full'
			paddingInline={20}
			paddingBlock={12}
			color='default'
		>
			<Box flexShrink={0}>
				<RoomAvatar size='x36' room={{ ...room, type: room.t }} />
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} minWidth={0} marginInlineStart={8}>
				<Box display='flex' alignItems='center'>
					<Box fontScale='p2b' withTruncatedText flexShrink={1}>
						{roomName}
					</Box>
					<Box flexShrink={0} marginInlineStart={8}>
						<Tag variant='secondary-info'>{t('Main_room')}</Tag>
					</Box>
					<Box flexGrow={1} />
					{lastMessage && (
						<Box fontScale='micro' color='hint' flexShrink={0} marginInlineStart={8}>
							{formatDate(lastMessage.ts)}
						</Box>
					)}
				</Box>
				{preview && (
					<Box display='flex' alignItems='center' color='secondary-info' fontScale='p2' marginBlockStart={2}>
						<Icon name='pin' size='x16' color='hint' marginInlineEnd={4} />
						{/* The preview comes HTML-escaped, so it is set as markup, the same way the sidebar does. */}
						<Box is='span' withTruncatedText className='message-body--unstyled' dangerouslySetInnerHTML={{ __html: preview }} />
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default ThreadsViewMainRoomItem;
