import { useState, useCallback } from 'react';
import { Box, Field, FieldGroup, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { addHours } from 'date-fns';

import DateTimePicker from './DateTimePicker';

type ScheduleMessageModalProps = {
	onClose: () => void;
	onSchedule: (scheduledAt: Date) => void;
	message: string;
};

const ScheduleMessageModal = ({ onClose, onSchedule, message }: ScheduleMessageModalProps) => {
	const t = useTranslation();
	const [customDate, setCustomDate] = useState<Date>(addHours(new Date(), 1));

	const isDateInvalid = customDate <= new Date();

	const handleCustomSchedule = useCallback(() => {
		if (isDateInvalid) {
			return;
		}
		onSchedule(customDate);
		onClose();
	}, [customDate, onSchedule, onClose, isDateInvalid]);

	return (
		<GenericModal
			title={t('Schedule_Message')}
			icon={null}
			variant='warning'
			onClose={onClose}
			onCancel={onClose}
			onConfirm={handleCustomSchedule}
			confirmText={t('Schedule')}
			confirmDisabled={isDateInvalid}
			annotation={t('Schedule_Message_Description')}
		>
			<FieldGroup>
				<Field>
					<FieldLabel>{t('Message')}</FieldLabel>
					<FieldRow>
						<Box
							p={12}
							bg='neutral'
							borderRadius='x4'
							color='default'
							style={{
								maxHeight: '100px',
								overflow: 'auto',
								wordBreak: 'break-word',
							}}
						>
							{message}
						</Box>
					</FieldRow>
				</Field>

				<Field>
					<FieldLabel>{t('Select_Date_and_Time')}</FieldLabel>
					<DateTimePicker value={customDate} onChange={setCustomDate} error={isDateInvalid} />
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ScheduleMessageModal;
