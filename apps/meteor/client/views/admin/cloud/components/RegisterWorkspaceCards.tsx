import { Grid } from '@rocket.chat/fuselage';
import { Card, CardBody, CardTitle } from '@rocket.chat/ui-client';
import React from 'react';

import useFeatureBullets from '../hooks/useFeatureBullets';

const RegisterWorkspaceCards = () => {
	const bulletFeatures = useFeatureBullets();

	return (
		<Grid mbs={16}>
			{bulletFeatures.map((card) => (
				<Grid.Item key={card.key} xs={4} sm={4} md={4} lg={4} xl={3}>
					<Card>
						<CardTitle>{card.title}</CardTitle>
						<CardBody height='x88'>{card.description}</CardBody>
					</Card>
				</Grid.Item>
			))}
		</Grid>
	);
};

export default RegisterWorkspaceCards;
