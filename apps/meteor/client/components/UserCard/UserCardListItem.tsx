import { css } from '@rocket.chat/css-in-js';
import { Box, Icon } from '@rocket.chat/fuselage';
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

export type UserCardListItemProps = {
	icon?: ComponentProps<typeof Icon>['name'];
	/** Visually hidden term announced by screen readers; renders the row as a `dt`/`dd` pair (requires a `dl` parent). */
	label?: string;
	children: ReactNode;
} & ComponentProps<typeof Box>;

const UserCardListItem = ({ icon, label, children, ...props }: UserCardListItemProps) => {
	const content = (
		<>
			{icon ? <Icon name={icon} size='x20' flexShrink={0} aria-hidden /> : <Box width='x20' flexShrink={0} aria-hidden />}
			<Box flexGrow={1} flexShrink={1} width='1px' marginInlineStart={4}>
				{children}
			</Box>
		</>
	);

	if (!label) {
		return (
			<Box display='flex' alignItems='flex-start' fontScale='p2' color='default' marginBlock={2} {...props}>
				{content}
			</Box>
		);
	}

	return (
		<>
			<Box is='dt' className={srOnly}>
				{label}
			</Box>
			<Box is='dd' display='flex' alignItems='flex-start' fontScale='p2' color='default' marginBlock={2} {...props}>
				{content}
			</Box>
		</>
	);
};

export default UserCardListItem;
