import { Card, CardTitle, CardBody, CardControls, CardHeader, CardCol } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { FramedIcon } from '@rocket.chat/ui-client';
import type { ComponentProps, ReactElement } from 'react';
import React from 'react';

import type { GenericCardButton } from './GenericCardButton';

type GenericCardProps = {
	title: string;
	body: string;
	buttons?: ReactElement<typeof GenericCardButton>[];
	icon?: ComponentProps<typeof FramedIcon>['icon'];
	type?: ComponentProps<typeof FramedIcon>['type'];
} & ComponentProps<typeof Card>;

export const GenericCard: React.FC<GenericCardProps> = ({ title, body, buttons, icon, type, ...props }) => {
	const cardId = useUniqueId();
	const descriptionId = useUniqueId();

	return (
		<Card role='region' aria-labelledby={cardId} aria-describedby={descriptionId} {...props}>
			<CardCol>
				<CardHeader>
					{icon && <FramedIcon icon={icon} type={type || 'neutral'} />}
					<CardTitle id={cardId}>{title}</CardTitle>
				</CardHeader>
				<CardBody id={descriptionId}>{body}</CardBody>
			</CardCol>
			{buttons && <CardControls>{buttons}</CardControls>}
		</Card>
	);
};
