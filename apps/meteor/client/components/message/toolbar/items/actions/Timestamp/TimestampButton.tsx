import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TimestampPicker } from './TimestampPicker';
import MessageToolbarItem from '../../../MessageToolbarItem';

const TimestampButton = () => {
	const { t } = useTranslation();
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	const handleClick = () => {
		setIsPickerOpen(true);
	};

	return (
		<>
			<MessageToolbarItem id='timestamp' icon='clock' title={t('Add_date_and_time')} qa='message-action-timestamp' onClick={handleClick} />
			{isPickerOpen && <TimestampPicker onClose={() => setIsPickerOpen(false)} />}
		</>
	);
};

export default TimestampButton;
