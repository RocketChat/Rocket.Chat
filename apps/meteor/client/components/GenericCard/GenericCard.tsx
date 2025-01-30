import { Card, CardTitle, CardBody, CardControls, CardHeader, FramedIcon } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ComponentProps, ReactElement } from 'react';

import type { GenericCardButton } from './GenericCardButton';

type GenericCardProps = {
	title: string;
	body: string;
	buttons?: ReactElement<typeof GenericCardButton>[];
	icon?: ComponentProps<typeof FramedIcon>['icon'];
	type?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
} & ComponentProps<typeof Card>;

export const GenericCard = ({ title, body, buttons, icon, type, ...props }: GenericCardProps) => {
	const cardId = useId();
	const descriptionId = useId();

	const iconType = type && {
		[type]: true,
	};

	return (
		<Card role='region' aria-labelledby={cardId} aria-describedby={descriptionId} {...props}>
			<CardHeader>
				{icon && <FramedIcon icon={icon} {...(type && iconType)} />}
				<CardTitle id={cardId}>{title}</CardTitle>
			</CardHeader>
			<CardBody id={descriptionId}>{body}</CardBody>
			{buttons && <CardControls>{buttons}</CardControls>}
		</Card>
	);
};
