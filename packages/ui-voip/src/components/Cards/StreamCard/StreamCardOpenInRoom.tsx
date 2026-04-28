import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CardSlotContainer from '../CardSlot';

type StreamCardOpenInRoomButtonProps = {
	onClick: () => void;
	showOnHover?: boolean;
};

const StreamCardOpenInRoomButton = ({ onClick, showOnHover = false }: StreamCardOpenInRoomButtonProps) => {
	const { t } = useTranslation();
	return (
		<CardSlotContainer position='middle' variant='transparent' showOnHover={showOnHover} margin={0}>
			<Button primary small icon='arrow-expand' onClick={onClick}>
				{t('Open_in_room')}
			</Button>
		</CardSlotContainer>
	);
};

export default StreamCardOpenInRoomButton;
