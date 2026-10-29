import { css } from '@rocket.chat/css-in-js';
import { Box, Chevron, Palette, useStyle } from '@rocket.chat/fuselage';
import type { CSSProperties, ReactNode } from 'react';

export type CollapseButtonProps = {
	children: ReactNode;
	regionId: string;
	expanded?: boolean;
	onClick: () => void;
};

// `[class]` outranks the Chevron frame's own alignment
const topChevron = css`
	&[class] {
		align-self: flex-start;
	}
`;

export const CollapseButton = ({ regionId, children, expanded, onClick }: CollapseButtonProps) => {
	const topChevronClassName = useStyle(topChevron);
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
				<Chevron size={32} down={!expanded} up={expanded} className={topChevronClassName} />
				<Box paddingBlock='x4' paddingInline='x4' fontWeight='700'>
					{children}
				</Box>
			</Box>
		</Box>
	);
};
