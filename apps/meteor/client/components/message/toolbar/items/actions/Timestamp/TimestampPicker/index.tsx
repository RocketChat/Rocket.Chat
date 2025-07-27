import { Box, Button, ButtonGroup, Modal, ModalClose, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import DatePicker from './DatePicker';
import FormatSelector from './FormatSelector';
import Preview from './Preview';
import TimePicker from './TimePicker';
import TimezoneSelector from './TimezoneSelector';
import { useTimestampPicker } from './useTimestampPicker';
import type { ComposerAPI } from '../../../../../../../lib/chats/ChatAPI';

type TimestampPickerProps = {
	onClose: () => void;
	composer?: ComposerAPI;
};

export const TimestampPicker = ({ onClose, composer }: TimestampPickerProps) => {
	const { t } = useTranslation();
	const {
		selectedDate,
		selectedFormat,
		selectedTimezone,
		handleDateChange,
		handleTimeChange,
		handleFormatChange,
		handleTimezoneChange,
		handleSubmit,
	} = useTimestampPicker(composer);

	const handleAddClick = () => {
		handleSubmit();
		onClose();
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Add_Date_And_Time')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Box display='flex' flexDirection='column' mbs='x16' pi='x16'>
					<DatePicker selectedDate={selectedDate} onChange={handleDateChange} />
					<TimePicker selectedDate={selectedDate} onChange={handleTimeChange} />
					<FormatSelector selectedFormat={selectedFormat} onChange={handleFormatChange} />
					<TimezoneSelector selectedTimezone={selectedTimezone} onChange={handleTimezoneChange} />
					<Preview date={selectedDate} format={selectedFormat} timezone={selectedTimezone} />
				</Box>
			</ModalContent>
			<ModalFooter>
				<Box w='full'>
					<ButtonGroup align='end'>
						<Button onClick={onClose}>{t('Cancel')}</Button>
						<Button primary onClick={handleAddClick}>
							{t('Add')}
						</Button>
					</ButtonGroup>
				</Box>
			</ModalFooter>
		</Modal>
	);
};
