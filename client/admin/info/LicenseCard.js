import React from 'react';
import { Box, Icon, ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import PlanTag from '../../components/basic/PlanTag';
import Card from '../../components/basic/Card/Card';
import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting } from '../../contexts/SettingsContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useHasLicense } from '../../../ee/client/hooks/useHasLicense';
import UsagePieGraph from './UsagePieGraph';
import OfflineLicenseModal from './OfflineLicenseModal';

const Feature = ({ label, enabled }) => <Box display='flex' flexDirection='row' mb='x4'>
	<Box color={enabled ? 'success' : 'danger'}><Icon name={enabled ? 'check' : 'cross'} size='x16' /></Box>
	{label}
</Box>;

const LicenseCard = () => {
	const t = useTranslation();

	const setModal = useSetModal();

	const currentLicense = useSetting('Enterprise_License');

	const isAirGapped = true;

	const hasEngagement = useHasLicense('engagement-dashboard');
	const hasOmnichannel = useHasLicense('livechat-enterprise');
	const hasAuditing = useHasLicense('auditing');
	const hasCannedResponses = useHasLicense('canned-responses');

	const handleApplyLicense = useMutableCallback(() => setModal(<OfflineLicenseModal onClose={() => { setModal(); }} license={currentLicense}/>));

	return <Card>
		<Card.Title>{t('License')}</Card.Title>
		<Card.Body>
			<Card.Col>
				<Card.Col.Section>
					<PlanTag />
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Features')}</Card.Col.Title>
					<Feature label={t('Omnichannel')} enabled={hasOmnichannel}/>
					<Feature label={t('Auditing')} enabled={hasAuditing}/>
					<Feature label={t('Canned_responses')} enabled={hasCannedResponses}/>
					<Feature label={t('Engagement_Dashboard')} enabled={hasEngagement}/>
				</Card.Col.Section>
				<Card.Col.Section>
					<Card.Col.Title>{t('Usage')}</Card.Col.Title>
					<Box display='flex' flexDirection='row'>
						<UsagePieGraph label={t('Users')} used={300} total={300} />
						<UsagePieGraph label={t('Integrations')} used={200} total={300} />
					</Box>
				</Card.Col.Section>
			</Card.Col>
		</Card.Body>
		<Card.Footer>
			<ButtonGroup align='end'>
				{isAirGapped
					? <Button small onClick={handleApplyLicense}>{t(currentLicense ? 'Cloud_Change_Offline_License' : 'Cloud_Apply_Offline_License')}</Button>
					: <Button small>{t('Cloud_connectivity')}</Button>
				}
			</ButtonGroup>
		</Card.Footer>
	</Card>;
};

export default LicenseCard;
