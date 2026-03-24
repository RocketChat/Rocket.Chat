import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CardSlotContainer from '../CardSlot';

type CardSlotStopSharingProps = {
	onClick: () => void;
	showOnHover?: boolean;
};

const CardSlotStopSharing = ({ onClick, showOnHover = false }: CardSlotStopSharingProps) => {
	const { t } = useTranslation();
	return (
		<CardSlotContainer position='middle' variant='transparent' showOnHover={showOnHover} margin={0}>
			<Button danger small icon='desktop-cross' onClick={onClick}>
				{t('Stop_sharing')}
			</Button>
		</CardSlotContainer>
	);
};

export default CardSlotStopSharing;
