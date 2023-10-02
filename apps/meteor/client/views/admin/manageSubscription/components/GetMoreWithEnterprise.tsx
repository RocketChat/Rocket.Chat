import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Grid, Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardTitle, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

const GetMoreWithEnterprise = (): ReactElement => {
	const { t } = useTranslation();

	const enterpriseSectionContent = [
		{
			title: t('GetMoreWithEnterprise_Card1_Title'),
			body: t('GetMoreWithEnterprise_Card1_Body'),
		},
		{
			title: t('GetMoreWithEnterprise_Card2_Title'),
			body: t('GetMoreWithEnterprise_Card2_Body'),
		},
		{
			title: t('GetMoreWithEnterprise_Card3_Title'),
			body: t('GetMoreWithEnterprise_Card3_Body'),
		},
		{
			title: t('GetMoreWithEnterprise_Card4_Title'),
			body: t('GetMoreWithEnterprise_Card4_Body'),
		},
		{
			title: t('GetMoreWithEnterprise_Card5_Title'),
			body: t('GetMoreWithEnterprise_Card5_Body'),
		},
		{
			title: t('GetMoreWithEnterprise_Card6_Title'),
			body: t('GetMoreWithEnterprise_Card6_Body'),
		},
	];

	return (
		<Box w='full' textAlign='center'>
			<States>
				<StatesIcon name='lightning' />
				<StatesTitle>{t('Get_more_with_Enterprise')}</StatesTitle>
				<StatesSubtitle>{t('Supercharge_your_workspace')}</StatesSubtitle>
			</States>
			<Grid mbe={48} mbs={8}>
				{enterpriseSectionContent.map(({ title, body }, index) => (
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
			<Button is='a' target='_blank' rel='noopener noreferrer' href='https://go.rocket.chat/i/undefined'>
				{t('Learn_more_about_enterprise')}
			</Button>
		</Box>
	);
};

export default memo(GetMoreWithEnterprise);
