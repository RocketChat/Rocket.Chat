import { useTranslation } from '@rocket.chat/ui-contexts';
import { useState } from 'react';

import { TimestampPicker } from './TimestampPicker';
import MessageToolbarItem from '../../../MessageToolbarItem';

const TimestampButton = () => {
	const t = useTranslation();
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	const handleClick = () => {
		setIsPickerOpen(true);
	};

	return (
		<>
			<MessageToolbarItem id='timestamp' icon='clock' title={t('Add_Date_And_Time')} qa='message-action-timestamp' onClick={handleClick} />
			{isPickerOpen && <TimestampPicker onClose={() => setIsPickerOpen(false)} />}
		</>
	);
};

export default TimestampButton;
