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
			{/* // TODO: use fuselage `desktop-cross` when available */}
			<Button danger small icon='desktop' onClick={onClick}>
				{t('Stop_sharing')}
			</Button>
		</CardSlotMiddle>
	);
};

export default CardSlotStopSharing;
