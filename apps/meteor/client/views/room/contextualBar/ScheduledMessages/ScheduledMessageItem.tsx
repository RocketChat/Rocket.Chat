import type { IScheduledMessage, Serialized } from '@rocket.chat/core-typings';
import { Box, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

type ScheduledMessageItemProps = {
	scheduledMessage: Serialized<IScheduledMessage>;
	onEdit: (scheduledMessage: Serialized<IScheduledMessage>) => void;
	onDelete: (scheduledMessage: Serialized<IScheduledMessage>) => void;
};

const ScheduledMessageItem = ({ scheduledMessage, onEdit, onDelete }: ScheduledMessageItemProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();

	return (
		<Box display='flex' alignItems='flex-start' paddingInline={24} paddingBlockEnd={12}>
			<Box flexGrow={1} withTruncatedText={false}>
				<Box fontScale='c1' color='hint'>
					{formatDateAndTime(new Date(scheduledMessage.scheduledAt))}
				</Box>
				<Box fontScale='p2' style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
					{scheduledMessage.msg}
				</Box>
			</Box>
			<Box display='flex' flexShrink={0} marginInlineStart={8}>
				<IconButton small icon='edit' title={t('Edit')} aria-label={t('Edit')} onClick={() => onEdit(scheduledMessage)} />
				<IconButton small icon='trash' title={t('Delete')} aria-label={t('Delete')} onClick={() => onDelete(scheduledMessage)} />
			</Box>
		</Box>
	);
};

export default ScheduledMessageItem;
