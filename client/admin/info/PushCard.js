import React from 'react';
import { Box, ButtonGroup, Button } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Card from '../../components/basic/Card/Card';
import { useTranslation } from '../../contexts/TranslationContext';
// import { useSetModal } from '../../contexts/ModalContext';
import UsagePieGraph from './UsagePieGraph';
// import PlanTag from '../../components/basic/PlanTag';
// import { useSetting } from '../../contexts/SettingsContext';
// import { useHasLicense } from '../../../ee/client/hooks/useHasLicense';
// import OfflineLicenseModal from './OfflineLicenseModal';

const PushCard = () => {
	const t = useTranslation();

	// const setModal = useSetModal();

	return <Card alignSelf='flex-start'>
		<Card.Title>{t('Push_Notifications')}</Card.Title>
		<Card.Body>
			<Card.Col>
				<Card.Col.Section>
					<Box display='flex' flexDirection='row' justifyContent='center'>
						<UsagePieGraph label={t('Push_Notifications')} used={300} total={300} size={180}/>
					</Box>
				</Card.Col.Section>
			</Card.Col>
		</Card.Body>
		<Card.Footer>
			<ButtonGroup align='end'>
				<Button small>{t('Details')}</Button>
			</ButtonGroup>
		</Card.Footer>
	</Card>;
};

export default PushCard;
