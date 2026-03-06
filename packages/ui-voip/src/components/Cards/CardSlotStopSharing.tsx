import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CardSlotMiddle from './CardSlotMiddle';

type CardSlotStopSharingProps = {
	onClick: () => void;
};

const CardSlotStopSharing = ({ onClick }: CardSlotStopSharingProps) => {
	const { t } = useTranslation();
	return (
		<CardSlotMiddle>
			<Button danger small icon='desktop-cross' onClick={onClick}>
				{t('Stop_sharing')}
			</Button>
		</CardSlotMiddle>
	);
};

export default CardSlotStopSharing;
