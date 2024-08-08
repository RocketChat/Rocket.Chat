import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { Tag, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React from 'react';

import { GenericTableCell, GenericTableRow } from '../../../../components/GenericTable';
import { RoomActivityIcon } from '../../../../omnichannel/components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../../omnichannel/hooks/useOmnichannelPriorities';
import { PriorityIcon } from '../../../../omnichannel/priorities/PriorityIcon';
import RemoveChatButton from '../../currentChats/RemoveChatButton';

const ChatTableRow = (room: IOmnichannelRoomWithDepartment) => {
	const t = useTranslation();
	const { _id, fname, tags, servedBy, ts, lm, department, open, onHold, priorityWeight } = room;
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();

	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');

	const directoryRoute = useRoute('omnichannel-directory');

	const getStatusText = (open = false, onHold = false): string => {
		if (!open) {
			return t('Closed');
		}

		return onHold ? t('On_Hold_Chats') : t('Room_Status_Open');
	};

	const onRowClick = useEffectEvent((id) =>
		directoryRoute.push({
			tab: 'chats',
			context: 'info',
			id,
		}),
	);

	return (
		<GenericTableRow key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
			<GenericTableCell withTruncatedText>
				<Box display='flex' flexDirection='column'>
					<Box withTruncatedText>{fname}</Box>
					{tags && (
						<Box color='hint' display='flex' flex-direction='row'>
							{tags.map((tag: string) => (
								<Box
									style={{
										marginTop: 4,
										whiteSpace: 'nowrap',
										overflow: tag.length > 10 ? 'hidden' : 'visible',
										textOverflow: 'ellipsis',
									}}
									key={tag}
									mie={4}
								>
									<Tag style={{ display: 'inline' }} disabled>
										{tag}
									</Tag>
								</Box>
							))}
						</Box>
					)}
				</Box>
			</GenericTableCell>
			{isPriorityEnabled && (
				<GenericTableCell>
					<PriorityIcon level={priorityWeight} />
				</GenericTableCell>
			)}
			<GenericTableCell withTruncatedText>{department?.name}</GenericTableCell>
			<GenericTableCell withTruncatedText>{servedBy?.username}</GenericTableCell>
			<GenericTableCell withTruncatedText>{moment(ts).format('L LTS')}</GenericTableCell>
			<GenericTableCell withTruncatedText>{moment(lm).format('L LTS')}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<RoomActivityIcon room={room} />
				{getStatusText(open, onHold)}
			</GenericTableCell>
			{canRemoveClosedChats && <GenericTableCell>{!open && <RemoveChatButton _id={_id} />}</GenericTableCell>}
		</GenericTableRow>
	);
};

export default ChatTableRow;
