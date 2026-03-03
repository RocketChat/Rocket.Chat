import { IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CardSlotContainer from './CardSlotContainer';
import type { SlotPosition } from './CardSlotContainer';

type CardSlotPinProps = {
	onClick: () => void;
	focused?: boolean;
	position: SlotPosition;
};

const CardSlotPin = ({ focused, onClick, position }: CardSlotPinProps) => {
	const { t } = useTranslation();
	return (
		<CardSlotContainer position={position}>
			<IconButton
				mi={-8} // TODO: this should not have negative margins, SlotContainer needs to be updated for special cases like this.
				tiny
				secondary={false}
				icon={focused ? 'cross' : 'pin'} // TODO: use pin-filled when available in fuselage
				onClick={onClick}
				title={focused ? t('Unpin') : t('Pin')}
			/>
		</CardSlotContainer>
	);
};

export default CardSlotPin;
