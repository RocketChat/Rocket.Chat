import React from 'react';
import { Box, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import Card from '../../components/basic/Card/Card';
import { useTranslation } from '../../contexts/TranslationContext';
import UsagePieGraph from './UsagePieGraph';
import InstancesModal from './InstancesModal';
import { useSetModal } from '../../contexts/ModalContext';

const InstancesCard = ({ instances }) => {
	const t = useTranslation();

	const setModal = useSetModal();

	const handleModal = useMutableCallback(() => { setModal(<InstancesModal instances={instances} onClose={() => setModal()}/>); });

	return <Card alignSelf='flex-start'>
		<Card.Title>{t('Instances')}</Card.Title>
		<Card.Body>
			<Card.Col>
				<Card.Col.Section>
					<Box display='flex' flexDirection='row' justifyContent='center'>
						<UsagePieGraph label={t('Instances_Health')} used={300} total={300} size={180}/>
					</Box>
				</Card.Col.Section>
			</Card.Col>
		</Card.Body>
		<Card.Footer>
			<ButtonGroup align='end'>
				<Button small onClick={handleModal}>{t('Details')}</Button>
			</ButtonGroup>
		</Card.Footer>
	</Card>;
};

export default InstancesCard;
