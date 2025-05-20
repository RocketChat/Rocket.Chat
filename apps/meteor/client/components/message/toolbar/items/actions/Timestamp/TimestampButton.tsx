import type { IMessage } from '@rocket.chat/core-typings';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

import MessageToolbarItem from '../../../MessageToolbarItem';
import TimestampPicker from './TimestampPicker';

type TimestampButtonProps = {
	message: IMessage;
};

const TimestampButton = ({ message }: TimestampButtonProps) => {
	const { t } = useTranslation();
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	const handleClick = () => {
		setIsPickerOpen(true);
	};

	return (
		<>
			<MessageToolbarItem
				id='timestamp'
				icon='clock'
				title={t('Add_Timestamp')}
				qa='message-action-timestamp'
				onClick={handleClick}
			/>
			{isPickerOpen && (
				<TimestampPicker
					messageId={message._id}
					onClose={() => setIsPickerOpen(false)}
				/>
			)}
		</>
	);
};

export default TimestampButton;