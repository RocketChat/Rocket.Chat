import { Box, IconButton } from '@rocket.chat/fuselage';
import { Card, CardBody, CardColSection, CardTitle } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import CardInfoModal from './CardInfoModal';
import CardUpgradeButton from './CardUpgradeButton';

export type FeatureUsageCardProps = {
	title: string;
	children?: ReactNode;
	infoText?: string;
	showUpgradeButton?: boolean;
};

const FeatureUsageCard = ({ children, title, infoText, showUpgradeButton }: FeatureUsageCardProps): ReactElement => {
	const setModal = useSetModal();

	const handleInfoClick = () => {
		if (!infoText) {
			setModal(null);
			return;
		}
		setModal(<CardInfoModal title={title} text={infoText} close={() => setModal(null)} />);
	};
	return (
		<Card minHeight={280}>
			<CardTitle fontScale='p2b'>
				<Box display='flex' alignItems='center'>
					{title} {infoText && <IconButton icon='info' mini title={infoText} onClick={() => handleInfoClick()} />}
				</Box>
			</CardTitle>
			<CardBody>
				<CardColSection display='flex' flexDirection='row' justifyContent='center' alignItems='center' fontScale='p2' h='full' w='full'>
					{children}
				</CardColSection>
			</CardBody>
			{showUpgradeButton && <CardUpgradeButton />}
		</Card>
	);
};

export default FeatureUsageCard;
