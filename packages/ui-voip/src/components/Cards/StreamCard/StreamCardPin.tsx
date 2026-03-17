import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CardSlotContainer from '../CardSlot';
import type { SlotPosition } from '../CardSlot';

type CardSlotPinProps = {
	onClick: () => void;
	focused?: boolean;
	position?: SlotPosition;
};

const CardSlotPin = ({ focused, onClick, position = 'bottomRight' }: CardSlotPinProps) => {
	const { t } = useTranslation();
	return (
		<CardSlotContainer position={position} variant='transparent'>
			<IconButton tiny secondary={true} icon={focused ? 'pin-filled' : 'pin'} onClick={onClick} title={focused ? t('Unpin') : t('Pin')} />
		</CardSlotContainer>
	);
};

export default CardSlotPin;
