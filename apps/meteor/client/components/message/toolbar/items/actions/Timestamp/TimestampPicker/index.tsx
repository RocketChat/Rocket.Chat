import { Modal, Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useTimestampPicker } from './useTimestampPicker';
import DatePicker from './DatePicker';
import TimePicker from './TimePicker';
import FormatSelector from './FormatSelector';
import Preview from './Preview';

type TimestampPickerProps = {
	messageId: string;
	onClose: () => void;
};

const TimestampPicker = ({ messageId, onClose }: TimestampPickerProps): ReactElement => {
	const { t } = useTranslation();
	const { 
		selectedDate, 
		selectedFormat, 
		handleDateChange, 
		handleTimeChange,
		handleFormatChange, 
		handleSubmit 
	} = useTimestampPicker(messageId);

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Add_Timestamp')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<DatePicker
					selectedDate={selectedDate}
					onChange={handleDateChange}
				/>
				<TimePicker
					selectedDate={selectedDate}
					onChange={handleTimeChange}
				/>
				<FormatSelector
					selectedFormat={selectedFormat}
					onChange={handleFormatChange}
				/>
				<Preview
					date={selectedDate}
					format={selectedFormat}
				/>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Box is="button" onClick={onClose}>
						{t('Cancel')}
					</Box>
					<Box is="button" onClick={handleSubmit}>
						{t('Add')}
					</Box>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default TimestampPicker;