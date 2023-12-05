import { Button, Card, CardTitle, CardBody, CardControls } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

type GenericCardProps = {
	title: string;
	body: string;
	buttons?: ComponentProps<typeof Button>[];
} & ComponentProps<typeof Card>;

const GenericCard: React.FC<GenericCardProps> = ({ title, body, buttons, ...props }) => {
	return (
		<Card width={340} {...props}>
			<CardTitle>{title}</CardTitle>
			<CardBody>{body}</CardBody>
			<CardControls>
				{buttons?.map(({ label, ...buttonProps }, index) => (
					<Button medium key={index} {...buttonProps}>
						{label}
					</Button>
				))}
			</CardControls>
		</Card>
	);
};

export default GenericCard;
