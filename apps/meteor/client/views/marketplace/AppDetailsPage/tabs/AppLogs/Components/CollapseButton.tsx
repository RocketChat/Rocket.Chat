import { css } from '@rocket.chat/css-in-js';
import { Box, Chevron, Palette, Stack } from '@rocket.chat/fuselage';
import type { CSSProperties, ReactNode } from 'react';

export type CollapseButtonProps = {
	children: ReactNode;
	regionId: string;
	expanded?: boolean;
	onClick: () => void;
};

export const CollapseButton = ({ regionId, children, expanded, onClick }: CollapseButtonProps) => {
	const clickable = css`
		background: ${Palette.surface['surface-light']};

		&:hover {
			background: ${Palette.surface['surface-tint']};
		}
	`;
	const style: CSSProperties = { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };
	return (
		<Box is='dt' style={style}>
			<Box
				is='button'
				role='button'
				onClick={onClick}
				className={clickable}
				aria-expanded={expanded}
				aria-controls={regionId}
				display='flex'
				flexDirection='row'
				width='full'
				focusable
				color={Palette.text['font-default']}
			>
				<Stack is='span'>
					<Chevron size={32} down={!expanded} up={expanded} />
				</Stack>
				<Box paddingBlock='x4' paddingInline='x4' fontWeight='700'>
					{children}
				</Box>
			</Box>
		</Box>
	);
};
