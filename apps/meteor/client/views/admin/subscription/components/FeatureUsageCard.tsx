import { Box, Card, CardBody, CardControls, CardTitle } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
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
};

const FeatureUsageCard = ({ children, card }: FeatureUsageCardProps): ReactElement => {
	const { title, infoText, upgradeButton } = card;

	const breakpoints = useBreakpoints();
	const isMobile = !breakpoints.includes('lg');

	return (
		<Card height={isMobile ? 'full' : 'x244'}>
			<CardTitle>
				{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
			</CardTitle>
			<CardBody>
				<Box h='full' w='full' display='flex' alignItems='center' justifyContent='center' flexDirection='column'>
					{children}
				</Box>
			</CardBody>
			{upgradeButton && <CardControls>{upgradeButton}</CardControls>}
		</Card>
	);
};

export default memo(FeatureUsageCard);
