import type { IOmnichannelRoomWithDepartment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Tag, Box } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { GenericTableCell, GenericTableRow } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import RemoveChatButton from './RemoveChatButton';
import { OmnichannelRoomIcon } from '../../../../../components/RoomIcon/OmnichannelRoomIcon';
import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useTimeFromNow } from '../../../../../hooks/useTimeFromNow';
import OmnichannelVerificationTag from '../../../components/OmnichannelVerificationTag';
import RoomActivityIcon from '../../../components/RoomActivityIcon';
import { useOmnichannelPriorities } from '../../../hooks/useOmnichannelPriorities';
import { useOmnichannelSource } from '../../../hooks/useOmnichannelSource';
import { PriorityIcon } from '../../../priorities/PriorityIcon';
import { useOmnichannelDirectoryRouter } from '../../hooks/useOmnichannelDirectoryRouter';

/**
 * TODO: We should have a variant for aligning row cell instead of using custom CSS
 **/
const customAlignTop = css`
	td {
		vertical-align: top;
	}
`;

const ChatsTableRow = (room: IOmnichannelRoomWithDepartment) => {
	const { t } = useTranslation();
	const { _id, fname, tags, servedBy, ts, department, open, priorityWeight, lm, onHold, source, verified } = room;
	const { enabled: isPriorityEnabled } = useOmnichannelPriorities();
	const getTimeFromNow = useTimeFromNow(true);
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
		<GenericTableRow className={customAlignTop} key={_id} tabIndex={0} onClick={() => onRowClick(_id)} action>
			<GenericTableCell withTruncatedText>
				<Box display='flex' flexDirection='column'>
					<Box withTruncatedText fontScale='p2m' color='default'>
						{fname}
					</Box>
					{tags && (
						<Box color='hint' display='flex' flex-direction='row'>
							{tags.map((tag: string) => (
								<Box marginBlockStart={4} marginInlineEnd={4} withTruncatedText overflow={tag.length > 10 ? 'hidden' : 'visible'} key={tag}>
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
					<Box marginInlineStart={8}>{getSourceLabel(source)}</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{servedBy?.username}</GenericTableCell>
			<GenericTableCell>
				<Box display='flex'>
					<OmnichannelVerificationTag verified={verified} />
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>{department?.name}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<Box display='flex' flexDirection='column'>
					<Box fontScale='p2m' withTruncatedText color='default'>
						{formatDate(ts)}
					</Box>
					<Box withTruncatedText>{getTimeFromNow(ts)}</Box>
				</Box>
			</GenericTableCell>
			<GenericTableCell withTruncatedText>
				{lm && (
					<Box display='flex' flexDirection='column'>
						<Box fontScale='p2m' withTruncatedText color='default'>
							{formatDate(lm)}
						</Box>
						<Box withTruncatedText>{getTimeFromNow(lm)}</Box>
					</Box>
				)}
			</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<RoomActivityIcon room={room} />
				{getStatusText(open, onHold)}
			</GenericTableCell>
			{canRemoveClosedChats && <GenericTableCell>{!open && <RemoveChatButton _id={_id} />}</GenericTableCell>}
		</GenericTableRow>
	);
};

export default ChatsTableRow;
