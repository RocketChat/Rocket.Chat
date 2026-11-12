import { css } from '@rocket.chat/css-in-js';
import { Card, CardTitle, CardBody, CardControls, CardHeader, FramedIcon, useStyle } from '@rocket.chat/fuselage';
import { useId } from 'react';
import type { ComponentProps, ReactElement } from 'react';

import type { GenericCardButton } from './GenericCardButton';

export type GenericCardProps = {
	title: string;
	body: string;
	buttons?: ReactElement<typeof GenericCardButton>[];
	icon?: ComponentProps<typeof FramedIcon>['icon'];
	type?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
	/** The width of the card, as a Fuselage size such as `x340`. */
	width?: `x${number}`;
	height?: 'full';
} & ComponentProps<typeof Card>;

export const GenericCard = ({ title, body, buttons, icon, type, width, height, className, ...props }: GenericCardProps) => {
	const sizeClassName = useStyle(css`
		${width ? `width: ${parseInt(width.slice(1), 10) / 16}rem;` : ''}
		${height ? 'height: 100%;' : ''}
	`);
	const cardId = useId();
	const descriptionId = useId();

	const iconType = type && {
		[type]: true,
	};

	return (
		<Card
			role='region'
			aria-labelledby={cardId}
			aria-describedby={descriptionId}
			className={[sizeClassName, className].filter(Boolean).join(' ')}
			{...props}
		>
			<CardHeader>
				{icon && <FramedIcon icon={icon} {...(type && iconType)} />}
				<CardTitle id={cardId}>{title}</CardTitle>
			</CardHeader>
			<CardBody id={descriptionId}>{body}</CardBody>
			{buttons && <CardControls>{buttons}</CardControls>}
		</Card>
	);
};
