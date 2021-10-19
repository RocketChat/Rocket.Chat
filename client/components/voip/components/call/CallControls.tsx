import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const CallControls: FC<{ room: any }> = ({ room }) => {
	const { state } = room;

	const onClose = () => 'DoTheMagicTrick';
	const onPickup = () => 'DoTheMagicTrick';

	return (
		<ButtonGroup align='end' flexGrow={1} maxWidth='full'>
			{state === 'current' && (
				<Button mi={4} p={0} m={0} size={28} primary success onClick={onPickup}>
					<Icon size={16} name='phone' />
				</Button>
			)}
			<Button mi={4} p={0} size={28} primary danger onClick={onClose}>
				<Icon size={16} name='phone-off' />
			</Button>
		</ButtonGroup>
	);
};

export default CallControls;
