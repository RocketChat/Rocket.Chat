import type { IRoom, IMessage } from '@rocket.chat/core-typings';
import {
	Modal,
	ModalHeader,
	ModalTitle,
	ModalClose,
	ModalContent,
	ModalFooter,
	Field,
	FieldLabel,
	FieldRow,
	TextInput,
	Button,
	ButtonGroup,
} from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type ScheduleMessageModalProps = {
	rid: IRoom['_id'];
	tmid?: IMessage['_id'];
	text: string;
	onClose: () => void;
	onScheduled?: () => void;
};

/**
 * Modal dialog enabling users to select a future date and time to schedule a message.
 */
const ScheduleMessageModal = ({ rid, tmid, text, onClose, onScheduled }: ScheduleMessageModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const scheduleMessageMethod = useMethod('scheduleMessage');

	const [scheduledAt, setScheduledAt] = useState('');
	const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
	const [isLoading, setIsLoading] = useState(false);

	const handleSchedule = async () => {
		if (!scheduledAt) {
			return;
		}

		try {
			setIsLoading(true);
			await scheduleMessageMethod({ rid, tmid, msg: text }, new Date(scheduledAt));
			dispatchToastMessage({ type: 'success', message: t('Message_scheduled_successfully') });
			onScheduled?.();
			onClose();
		} catch (error: any) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Schedule_Message')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Field>
					<FieldLabel>{t('Date_and_Time')}</FieldLabel>
					<FieldRow>
						<TextInput
							type='datetime-local'
							min={minDateTime}
							value={scheduledAt}
							onChange={(e) => setScheduledAt(e.currentTarget.value)}
						/>
					</FieldRow>
				</Field>
			</ModalContent>
			<ModalFooter>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary loading={isLoading} disabled={!scheduledAt} onClick={handleSchedule}>
						{t('Schedule')}
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	);
};

export default ScheduleMessageModal;
