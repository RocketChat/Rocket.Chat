import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Button, ButtonGroup, CardGrid } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericCard } from '../../../../components/GenericCard';
import { useExternalLink } from '../../../../hooks/useExternalLink';
import { PRICING_LINK } from '../utils/links';

type UpgradeToGetMoreProps = {
	activeModules: string[];
	isEnterprise: boolean;
	children: ReactNode;
};

const enterpriseModules = [
	'scalability',
	'accessibility-certification',
	'engagement-dashboard',
	'oauth-enterprise',
	'custom-roles',
	'auditing',
];

const UpgradeToGetMore = ({ activeModules, children }: UpgradeToGetMoreProps) => {
	const { t } = useTranslation();
	const handleOpenLink = useExternalLink();

	const upgradeModules = enterpriseModules
		.filter((module) => !activeModules.includes(module))
		.map((module) => {
			return {
				title: t(`UpgradeToGetMore_${module}_Title`),
				body: t(`UpgradeToGetMore_${module}_Body`),
			};
		});

	if (upgradeModules?.length === 0) {
		return (
			<ButtonGroup large vertical>
				{children}
			</ButtonGroup>
		);
	}

	return (
		<Box w='full' p={8} mbs={40}>
			<States>
				<StatesIcon name='rocket' />
				<StatesTitle>{t('UpgradeToGetMore_Headline')}</StatesTitle>
				<StatesSubtitle>{t('UpgradeToGetMore_Subtitle')}</StatesSubtitle>
			</States>
			<CardGrid
				breakpoints={{
					xs: 4,
					sm: 4,
					md: 4,
					lg: 6,
					xl: 4,
					p: 8,
				}}
			>
				{upgradeModules.map((card, index) => {
					return <GenericCard key={index} icon='check' type='success' height='full' {...card} />;
				})}
			</CardGrid>
			<Box pbs={24}>
				<ButtonGroup large vertical>
					<Button icon='new-window' onClick={() => handleOpenLink(PRICING_LINK)} role='link'>
						{t('Compare_plans')}
					</Button>
					{children}
				</ButtonGroup>
			</Box>
		</Box>
	);
};

export default memo(UpgradeToGetMore);
