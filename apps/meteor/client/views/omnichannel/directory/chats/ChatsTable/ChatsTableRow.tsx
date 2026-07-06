import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { Tag, Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RemoveChatButton from './RemoveChatButton';
import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useReactiveTimeFromNow } from '../../../../../hooks/useReactiveTimeFromNow';
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
	const relativeStartedTime = useReactiveTimeFromNow(ts, true);
	const relativeLastMessageTime = useReactiveTimeFromNow(lm, true);
	const formatDate = useFormatDate();
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

	const onRowClick = useStableCallback((id: string) =>
		omnichannelDirectoryRouter.navigate({
			tab: 'chats',
			context: 'info',
			id,
		}),
	);

	return (
		<GenericTableRow key={_id} tabIndex={0} onClick={() => onRowClick(_id)} action>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				<Box display='flex' flexDirection='column'>
					<Box withTruncatedText fontScale='p2m'>
						{fname}
					</Box>
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
				<GenericTableCell verticalAlign='top'>
					<PriorityIcon level={priorityWeight} />
				</GenericTableCell>
			)}
			<GenericTableCell withTruncatedText verticalAlign='top'>
				<Box display='flex' alignItems='center'>
					<OmnichannelRoomIcon size='x20' source={source} />
					<Box mis={8}>{getSourceLabel(source)}</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				{servedBy?.username}
			</GenericTableCell>
			<GenericTableCell verticalAlign='top'>
				<Box display='flex'>
					<OmnichannelVerificationTag verified={verified} />
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				{department?.name}
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				<Box display='flex' flexDirection='column'>
					<Box fontScale='p2m' withTruncatedText title={formatDate(ts)}>
						{formatDate(ts)}
					</Box>
					<Box color='hint' withTruncatedText title={relativeStartedTime}>
						{relativeStartedTime}
					</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				{lm && (
					<Box display='flex' flexDirection='column'>
						<Box fontScale='p2m' withTruncatedText title={formatDate(lm)}>
							{formatDate(lm)}
						</Box>
						<Box color='hint' withTruncatedText title={relativeLastMessageTime}>
							{relativeLastMessageTime}
						</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell withTruncatedText verticalAlign='top'>
				<RoomActivityIcon room={room} />
				{getStatusText(open, onHold)}
			</GenericTableCell>
			{canRemoveClosedChats && <GenericTableCell verticalAlign='top'>{!open && <RemoveChatButton _id={_id} />}</GenericTableCell>}
		</GenericTableRow>
	);
};

export default ChatsTableRow;
