import { Button, Card, CardTitle, CardBody, CardControls, CardHeader, CardCol } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { FramedIcon } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import React from 'react';

type GenericCardProps = {
	title: string;
	body: string;
	buttons?: ComponentProps<typeof Button>[];
	icon?: ComponentProps<typeof FramedIcon>['icon'];
	type?: ComponentProps<typeof FramedIcon>['type'];
} & ComponentProps<typeof Card>;

const GenericCard: React.FC<GenericCardProps> = ({ title, body, buttons, icon, type, ...props }) => {
	const cardId = useUniqueId();

	return (
		<Card role='region' aria-labelledby={cardId} {...props}>
			<CardCol>
				<CardHeader>
					{icon && <FramedIcon icon={icon} type={type || 'neutral'} />}
					<CardTitle id={cardId}>{title}</CardTitle>
				</CardHeader>
				<CardBody>{body}</CardBody>
			</CardCol>
			{buttons && (
				<CardControls>
					{buttons.map(({ label, ...buttonProps }, index) => (
						<Button medium key={index} {...buttonProps}>
							{label}
						</Button>
					))}
				</CardControls>
			)}
		</Card>
	);
};

export default GenericCard;
