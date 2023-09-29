import { Box, States, StatesIcon, StatesTitle, StatesSubtitle, Grid, Button } from '@rocket.chat/fuselage';
import { Card, CardBody, CardTitle, FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

const EnterpriseSectionContent = [
	{
		title: 'High scalabaility',
		body: 'Improve concurrent user usage with microservices deployment. Switching from monolithic decreases costs and improves efficiency.',
	},
	{
		title: 'High scalabaility',
		body: 'Improve concurrent user usage with microservices deployment. Switching from monolithic decreases costs and improves efficiency.',
	},
	{
		title: 'High scalabaility',
		body: 'Improve concurrent user usage with microservices deployment. Switching from monolithic decreases costs and improves efficiency.',
	},
	{
		title: 'High scalabaility',
		body: 'Improve concurrent user usage with microservices deployment. Switching from monolithic decreases costs and improves efficiency.',
	},
	{
		title: 'High scalabaility',
		body: 'Improve concurrent user usage with microservices deployment. Switching from monolithic decreases costs and improves efficiency.',
	},
	{
		title: 'High scalabaility',
		body: 'Improve concurrent user usage with microservices deployment. Switching from monolithic decreases costs and improves efficiency.',
	},
];

const GetMoreWithEnterprise = (): ReactElement => {
	return (
		<Box w='full' textAlign='center'>
			<States>
				<StatesIcon name='lightning' />
				<StatesTitle>Get more with Enterprise</StatesTitle>
				<StatesSubtitle>Supercharge your workspace with these exclusive Enterprise plan capabilities.</StatesSubtitle>
			</States>
			<Grid mbe={48} mbs={8}>
				{EnterpriseSectionContent?.map(({ title, body }, index) => (
					<Grid.Item lg={4} xs={4} p={8} key={index}>
						<Card>
							<CardTitle display='flex' alignItems='center'>
								<FramedIcon type='success' icon='rocket' />
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
			<Button is='a' href='https://go.rocket.chat/i/enterprise'>
				Learn more about enterprise
			</Button>
		</Box>
	);
};

export default memo(GetMoreWithEnterprise);
