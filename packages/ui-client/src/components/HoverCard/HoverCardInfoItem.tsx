import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Item, ItemContent, ItemLink, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

const srOnly = css`
	position: absolute;
	overflow: hidden;
	clip: rect(0 0 0 0);
	width: 1px;
	height: 1px;
	padding: 0;
	border: 0;
	margin: -1px;
	white-space: nowrap;
`;

export type HoverCardInfoItemProps = {
	icon?: ComponentProps<typeof Icon>['name'];
	/** Visually hidden term announced by screen readers before the value. */
	label?: string;
	/** Makes the whole row a button. */
	onClick?: () => void;
	children: ReactNode;
};

const HoverCardInfoItem = ({ icon, label, onClick, children }: HoverCardInfoItemProps) => {
	const media = (
		<ItemMedia variant='icon'>
			{icon ? <Icon name={icon} size='x20' title={label} aria-hidden /> : <Box width='x20' aria-hidden />}
		</ItemMedia>
	);

	const title = (
		<ItemTitle truncate={false}>
			{label && <Box is='span' className={srOnly}>{`${label}: `}</Box>}
			{onClick ? (
				<ItemLink is='button' onClick={onClick}>
					{children}
				</ItemLink>
			) : (
				children
			)}
		</ItemTitle>
	);

	return (
		<Item is='li'>
			{media}
			<ItemContent>{title}</ItemContent>
		</Item>
	);
};

export default HoverCardInfoItem;
