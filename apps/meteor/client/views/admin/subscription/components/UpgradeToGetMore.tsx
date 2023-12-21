import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Grid, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Card, CardBody, CardTitle, FramedIcon } from '@rocket.chat/ui-client';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useExternalLink } from '../../../../hooks/useExternalLink';
import { PRICING_LINK } from '../utils/links';

type UpgradeToGetMoreProps = {
	activeModules: string[];
	isEnterprise: boolean;
	children: React.ReactNode;
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
		<Box w='full' textAlign='center' p={8} mbs={40}>
			<States>
				<StatesIcon name='rocket' />
				<StatesTitle>{t('UpgradeToGetMore_Headline')}</StatesTitle>
				<StatesSubtitle>{t('UpgradeToGetMore_Subtitle')}</StatesSubtitle>
			</States>
			<Grid mbe={48} mbs={8}>
				{upgradeModules.map(({ title, body }, index) => (
					<Grid.Item lg={4} xs={4} p={8} key={index}>
						<Card>
							<CardTitle>
								<Box display='flex' alignItems='center'>
									<FramedIcon type='success' icon='check' />
									<Box mis={8} is='h4'>
										{title}
									</Box>
								</Box>
							</CardTitle>
							<CardBody>
								<Box color='font-secondary-info' textAlign='left'>
									{body}
								</Box>
							</CardBody>
						</Card>
					</Grid.Item>
				))}
			</Grid>
			<ButtonGroup large vertical>
				<Button icon='new-window' onClick={() => handleOpenLink(PRICING_LINK)}>
					{t('Compare_plans')}
				</Button>
				{children}
			</ButtonGroup>
		</Box>
	);
};

export default memo(UpgradeToGetMore);
