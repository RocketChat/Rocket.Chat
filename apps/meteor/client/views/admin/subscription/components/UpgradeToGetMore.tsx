import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Grid, Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardTitle, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PRICING_LINK } from '../utils/links';

type UpgradeToGetMoreProps = {
	activeModules: string[];
	isEnterprise: boolean;
};

const UpgradeToGetMore = ({ activeModules, isEnterprise }: UpgradeToGetMoreProps): ReactElement => {
	const { t } = useTranslation();

	const getEnterpriseSectionContent = () => {
		const enterpriseModules = [
			'scalability',
			'accessibility-certification',
			'engagement-dashboard',
			'oauth-enterprise',
			'custom-roles',
			'auditing',
		];

		if (!isEnterprise) {
			return enterpriseModules.map((module) => {
				return { title: t(`UpgradeToGetMore_${module}_Title`), body: t(`UpgradeToGetMore_${module}_Body`) };
			});
		}

		const missingModules = enterpriseModules.filter((module) => !activeModules.includes(module));

		return missingModules.map((module) => {
			return {
				title: t(`UpgradeToGetMore_${module}_Title`),
				body: t(`UpgradeToGetMore_${module}_Body`),
			};
		});
	};

	const upgradeModules = getEnterpriseSectionContent();

	return upgradeModules?.length > 0 ? (
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
							<CardTitle display='flex' alignItems='center'>
								<FramedIcon type='success' icon='check' />
								<Box mis={8} is='h4'>
									{title}
								</Box>
							</CardTitle>
							<CardBody color='font-secondary-info' textAlign='left'>
								{body}
							</CardBody>
						</Card>
					</Grid.Item>
				))}
			</Grid>
			<Trans i18nKey='Compare_plans'>
				<Button is='a' external href={PRICING_LINK}>
					Compare plans
				</Button>
			</Trans>
		</Box>
	) : (
		<></>
	);
};

export default memo(UpgradeToGetMore);
