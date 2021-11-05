import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const CallControls: FC<{ state: any; disabled?: boolean }> = ({ state, disabled = false }) => {
	const onClose = () => 'DoTheMagicTrick';
	const onPickup = () => 'DoTheMagicTrick';
	const t = useTranslation();

	return (
		<ButtonGroup align='end' flexGrow={1} maxWidth='full'>
			{state === 'incoming' && (
				<Button
					disabled={disabled}
					mis={4}
					p={0}
					m={0}
					size={28}
					primary
					success
					onClick={onPickup}
					title={t('Answer_call')}
				>
					<Icon size={16} name='phone' />
				</Button>
			)}
			<Button
				disabled={disabled}
				mis={4}
				p={0}
				size={28}
				primary
				danger
				onClick={onClose}
				title={t('End_call')}
			>
				<Icon size={16} name='phone-off' />
			</Button>
		</ButtonGroup>
	);
};

export default CallControls;
