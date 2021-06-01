// import { ButtonGroup, Button, Skeleton, Margins } from '@rocket.chat/fuselage';
import { Box, ButtonGroup, StatusBullet, ToggleSwitch } from '@rocket.chat/fuselage';
// import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import Card from '../../../components/Card';
// import { useSetModal } from '../../../contexts/ModalContext';
// import { useSetting } from '../../../contexts/SettingsContext';
import { useTranslation } from '../../../contexts/TranslationContext';

import { UserStatus } from '/client/components/UserStatus';
// import { AsyncStatePhase } from '../../../hooks/useAsyncState';
// import { useEndpointData } from '../../../hooks/useEndpointData';
// import Feature from './Feature';
// import OfflineLicenseModal from './OfflineLicenseModal';
// import UsagePieGraph from './UsagePieGraph';

const Header = ({ children }) => (
	<Box display='flex' flexDirection='row' justifyContent='space-between'>
		{children}
	</Box>
);

const Section = ({ status, title, subtitle, link = '' }) => (
	<Card.Col.Section display='flex' alignItems='flex-start'>
		<Card.Icon>
			<UserStatus status={status} />
		</Card.Icon>
		<Box flexDirection='column'>
			<Card.Col.Title>{title}</Card.Col.Title>
			{subtitle}
			<br />
			{link && <a href='#'>{link}</a>}
		</Box>
	</Card.Col.Section>
);

// const FederationCard = ({ statistics, isLoading }) => {
const FederationCard = ({ statistics, isLoading }) => {
	const t = useTranslation();

	// const setModal = useSetModal();
	//
	// const currentLicense = useSetting('Enterprise_License');
	// const licenseStatus = useSetting('Enterprise_License_Status');
	//
	// const isAirGapped = true;
	//
	// const { value, phase, error } = useEndpointData('licenses.get');
	// const endpointLoading = phase === AsyncStatePhase.LOADING;
	//
	// const { maxActiveUsers = 0, modules = [] } =
	// 	endpointLoading || error || !value.licenses.length ? {} : value.licenses[0];
	//
	// const hasEngagement = modules.includes('engagement-dashboard');
	// const hasOmnichannel = modules.includes('livechat-enterprise');
	// const hasAuditing = modules.includes('auditing');
	// const hasCannedResponses = modules.includes('canned-responses');
	//
	// const handleApplyLicense = useMutableCallback(() =>
	// 	setModal(
	// 		<OfflineLicenseModal
	// 			onClose={() => {
	// 				setModal();
	// 			}}
	// 			license={currentLicense}
	// 			licenseStatus={licenseStatus}
	// 		/>,
	// 	),
	// );

	return (
		<Card>
			<Header>
				<Card.Title>{t('Federation')}</Card.Title>
				<Box display='flex'>
					<Box mb='x8' fontScale='c1' display='flex'>
						{t('Enabled')}
					</Box>
					<ToggleSwitch mb='x6' mis='x6' />
				</Box>
			</Header>
			<Card.Body>
				<Card.Col span={2}>
					<Section
						status='online'
						title={t('Enable Federation')}
						subtitle='Federation integration is working correctly.'
					/>
					<Section
						status='busy'
						title={t('Adding Federation to your Server')}
						subtitle='Changes needed on your Server the Domain Name, Target and Port.'
						link='Fix now!'
					/>
					<Section
						status='offline'
						title={t('Adding users from another server')}
						subtitle='We guide you on how to add your first federated user.'
					/>
				</Card.Col>
			</Card.Body>
			<Card.Footer>
				<ButtonGroup align='end'>
					{/* {isAirGapped ? (*/}
					{/*	<Button small onClick={handleApplyLicense}>*/}
					{/*		{t(currentLicense ? 'Cloud_Change_Offline_License' : 'Cloud_Apply_Offline_License')}*/}
					{/*	</Button>*/}
					{/* ) : (*/}
					{/*	<Button small>{t('Cloud_connectivity')}</Button>*/}
					{/* )}*/}
				</ButtonGroup>
			</Card.Footer>
		</Card>
	);
};

export default FederationCard;
