import { Box, InputBox } from '@rocket.chat/fuselage';
import { GenericModal, useFormatDateAndTime } from '@rocket.chat/ui-client';
import { format } from 'date-fns/format';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getSchedulePresets } from './schedulePresets';
import { isScheduledAtInRange } from '../../../lib/scheduledMessageLimits';

type ScheduleMessageModalProps = {
	initialDate?: Date;
	onConfirm: (date: Date) => Promise<unknown>;
	onClose: () => void;
};

const ScheduleMessageModal = ({ initialDate, onConfirm, onClose }: ScheduleMessageModalProps) => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const [start] = useState(() => initialDate ?? getSchedulePresets(new Date()).tomorrow);
	const [date, setDate] = useState(() => format(start, 'yyyy-MM-dd'));
	const [time, setTime] = useState(() => format(start, 'HH:mm'));
	const [isSubmitting, setSubmitting] = useState(false);

	const parsed = new Date(`${date}T${time}`);
	const scheduledAt = date && time && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
	const inRange = scheduledAt !== undefined && isScheduledAtInRange(scheduledAt, new Date());

	const handleConfirm = async () => {
		if (!scheduledAt || !inRange) {
			return;
		}
		setSubmitting(true);
		await onConfirm(scheduledAt).catch(() => undefined);
		setSubmitting(false);
	};

	return (
		<GenericModal
			variant='warning'
			icon={null}
			title={t('Schedule_message')}
			onConfirm={handleConfirm}
			onCancel={onClose}
			onClose={onClose}
			confirmText={t('Schedule')}
			confirmIcon='send'
			confirmDisabled={!inRange}
			confirmLoading={isSubmitting}
		>
			<Box display='flex' gap='x8'>
				<Box flexGrow={1}>
					<InputBox
						aria-label={t('Date')}
						type='date'
						value={date}
						min={format(new Date(), 'yyyy-MM-dd')}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.currentTarget.value)}
					/>
				</Box>
				<Box flexGrow={1}>
					<InputBox
						aria-label={t('Time')}
						type='time'
						value={time}
						onChange={(e: ChangeEvent<HTMLInputElement>) => setTime(e.currentTarget.value)}
					/>
				</Box>
			</Box>
			<Box marginBlockStart='x8' fontScale='c1' color={inRange ? 'hint' : 'danger'}>
				{inRange
					? t('Schedule_sends_at', { date: formatDateAndTime(scheduledAt), timeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone })
					: t('error-scheduled-message-time-out-of-range')}
			</Box>
		</GenericModal>
	);
};

export default ScheduleMessageModal;
