import { Card, CardBody, CardColSection, CardFooter, CardTitle } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import InfoTextIconModal from './InfoTextIconModal';

type FeatureUsageCardProps = {
	children?: ReactNode;
	card: CardProps;
};

export type CardProps = {
	title: string;
	infoText?: string;
	upgradeButton?: ReactNode;
};

const FeatureUsageCard = ({ children, card }: FeatureUsageCardProps): ReactElement => {
	const { title, infoText, upgradeButton } = card;
	return (
		<Card>
			<CardTitle>
				{title} {infoText && <InfoTextIconModal title={title} infoText={infoText} />}
			</CardTitle>
			<CardBody minHeight='x184'>
				<CardColSection display='flex' flexDirection='row' justifyContent='center' alignItems='center' fontScale='p2' h='full' w='full'>
					{children}
				</CardColSection>
			</CardBody>
			{upgradeButton && <CardFooter>{upgradeButton}</CardFooter>}
		</Card>
	);
};

export default memo(FeatureUsageCard);
