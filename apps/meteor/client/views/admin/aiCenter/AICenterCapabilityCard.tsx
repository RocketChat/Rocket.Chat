import type { FramedIconProps } from '@rocket.chat/fuselage';
import { Box, Button, Card, CardBody, CardControls, CardHeader, CardTitle, FramedIcon } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import { useId } from 'react';

export type AICenterCapabilityCardProps = {
	icon: FramedIconProps['icon'];
	title: string;
	description: string;
	status?: ReactNode;
	actionLabel: string;
	href: string;
};

const AICenterCapabilityCard = ({ icon, title, description, status, actionLabel, href }: AICenterCapabilityCardProps): ReactElement => {
	const titleId = useId();
	const descriptionId = useId();

	return (
		<Card height='full' role='region' aria-labelledby={titleId} aria-describedby={descriptionId}>
			<CardHeader>
				<FramedIcon icon={icon} />
				{status && <Box marginInlineStart='auto'>{status}</Box>}
			</CardHeader>
			<CardTitle id={titleId}>{title}</CardTitle>
			<CardBody id={descriptionId} flexDirection='column'>
				{description}
			</CardBody>
			<CardControls>
				<Button is='a' href={href} medium>
					{actionLabel}
				</Button>
			</CardControls>
		</Card>
	);
};

export default AICenterCapabilityCard;
