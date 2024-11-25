import { Box, Card, CardBody, CardControls, CardTitle } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import InfoTextIconModal from './InfoTextIconModal';

type FeatureUsageCardProps = {
	children?: ReactNode;
	card: CardProps;
};

export type CardProps = {
	title: string;
	infoText?: ReactNode;
	upgradeButton?: ReactNode;
	isHorizontallyCenteredOnly?: boolean;
};

const FeatureUsageCard = ({ children, card }: FeatureUsageCardProps): ReactElement => {
	const { title, infoText, upgradeButton, isHorizontallyCenteredOnly } = card;

	return (
		<Card height='full' style={{ minHeight: '244px' }}>
			<CardTitle>
				{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
			</CardTitle>
			<CardBody>
				<Box
					h='full'
					w='full'
					display='flex'
					alignItems='center'
					justifyContent={isHorizontallyCenteredOnly ? 'flex-start' : 'center'}
					flexDirection='column'
				>
					{children}
				</Box>
			</CardBody>
			{upgradeButton && <CardControls>{upgradeButton}</CardControls>}
		</Card>
	);
};

export default memo(FeatureUsageCard);
