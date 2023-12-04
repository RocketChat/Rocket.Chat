import { Button, Card, CardTitle, CardBody, CardControls } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import React from 'react';

type GenericCardProps = {
	title: string;
	body: string;
	controls?: ComponentProps<typeof Button>[];
} & Omit<ComponentProps<typeof Card>, 'controls'>;

const GenericCard: React.FC<GenericCardProps> = ({ title, body, controls, ...props }) => {
	return (
		<Card {...props}>
			<CardTitle>{title}</CardTitle>
			<CardBody>{body}</CardBody>
			<CardControls>
				{controls?.map(({ label, ...control }, index) => (
					<Button key={index} {...control}>
						{label}
					</Button>
				))}
			</CardControls>
		</Card>
	);
};

export default GenericCard;
