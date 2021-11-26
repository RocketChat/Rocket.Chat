import { ActionButton, Sidebar } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const CallControls: FC<{ state: any; disabled?: boolean }> = ({ state, disabled = false }) => {
	const onClose = (): void => console.log('DoTheMagicTrick');
	const onPickup = (): void => console.log('DoTheMagicTrick');
	const t = useTranslation();

	return (
		<Sidebar.Item.Actions alignSelf='flex-end' flexGrow={0}>
			{state === 'incoming' && (
				<ActionButton
					// Using ActionButton instead of Sidebar.Item.Action TS errors when using the icon prop
					disabled={disabled}
					mis={4}
					primary
					success
					onClick={onPickup}
					small
					title={t('Answer_call')}
					icon='phone'
				/>
			)}
			<ActionButton
				// Using ActionButton instead of Sidebar.Item.Action TS errors when using the icon prop
				disabled={disabled}
				mis={4}
				p={0}
				primary
				danger
				onClick={onClose}
				small
				title={t('End_call')}
				icon='phone-off'
			/>
		</Sidebar.Item.Actions>
	);
};

export default CallControls;
