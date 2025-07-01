import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';

import DatePicker from './DatePicker';
import FormatSelector from './FormatSelector';
import Preview from './Preview';
import TimePicker from './TimePicker';
import { useTimestampPicker } from './useTimestampPicker';
import type { ComposerAPI } from '../../../../../../../lib/chats/ChatAPI';

type TimestampPickerProps = {
	onClose: () => void;
	composer?: ComposerAPI;
};

export const TimestampPicker = ({ onClose, composer }: TimestampPickerProps) => {
	const t = useTranslation();
	const { selectedDate, selectedFormat, handleDateChange, handleTimeChange, handleFormatChange, handleSubmit } =
		useTimestampPicker(composer);

	const handleAddClick = () => {
		handleSubmit();
		onClose();
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Add_Date_And_Time')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box display='flex' flexDirection='column' mbs='x16' pi='x16'>
					<DatePicker selectedDate={selectedDate} onChange={handleDateChange} />
					<TimePicker selectedDate={selectedDate} onChange={handleTimeChange} />
					<FormatSelector selectedFormat={selectedFormat} onChange={handleFormatChange} />
					<Preview date={selectedDate} format={selectedFormat} />
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Box w='full'>
					<ButtonGroup align='end'>
						<Button onClick={onClose}>{t('Cancel')}</Button>
						<Button primary onClick={handleAddClick}>
							{t('Add')}
						</Button>
					</ButtonGroup>
				</Box>
			</Modal.Footer>
		</Modal>
	);
};
