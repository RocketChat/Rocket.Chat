import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { Tag, Box } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RemoveChatButton from './RemoveChatButton';
import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import OmnichannelVerificationTag from '../../../components/OmnichannelVerificationTag';
import RoomActivityIcon from '../../../components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import { PriorityIcon } from '../../../priorities/PriorityIcon';
import { useOmnichannelDirectoryRouter } from '../../hooks/useOmnichannelDirectoryRouter';

const ChatsTableRow = (room: IOmnichannelRoomWithDepartment) => {
	const { t } = useTranslation();
	const { _id, fname, tags, servedBy, ts, department, open, priorityWeight, lm, onHold, source, verified } = room;
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const getTimeFromNow = useTimeFromNow(true);
	const { getSourceLabel } = useOmnichannelSource();

	const canRemoveClosedChats = usePermission('remove-closed-livechat-room');
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();

	const getStatusText = (open = false, onHold = false): string => {
		if (!open) {
			return t('Closed');
		}

		if (open && !servedBy) {
			return t('Queued');
		}

		return onHold ? t('On_Hold_Chats') : t('Room_Status_Open');
	};

	const onRowClick = useEffectEvent((id: string) =>
		omnichannelDirectoryRouter.navigate({
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
								<Box mbs={4} mie={4} withTruncatedText overflow={tag.length > 10 ? 'hidden' : 'visible'} key={tag}>
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
			<GenericTableCell withTruncatedText>
				<Box display='flex' alignItems='center'>
					<OmnichannelRoomIcon size='x20' source={source} />
					<Box mis={8}>{getSourceLabel(source)}</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{servedBy?.username}</GenericTableCell>
			<GenericTableCell>
				<Box display='flex'>
					<OmnichannelVerificationTag verified={verified} />
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{department?.name}</GenericTableCell>
			<GenericTableCell withTruncatedText>{getTimeFromNow(ts)}</GenericTableCell>
			<GenericTableCell withTruncatedText>{getTimeFromNow(lm)}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<RoomActivityIcon room={room} />
				{getStatusText(open, onHold)}
			</GenericTableCell>
			{canRemoveClosedChats && <GenericTableCell>{!open && <RemoveChatButton _id={_id} />}</GenericTableCell>}
		</GenericTableRow>
	);
};

export default ChatsTableRow;
