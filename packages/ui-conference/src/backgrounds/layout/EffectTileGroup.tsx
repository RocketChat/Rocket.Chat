import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

const gridStyles = css`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.75rem;
	margin: 0;
	padding: 0;
	list-style: none;
	outline: none;
`;

type EffectTileGroupProps = HTMLAttributes<HTMLElement> & {
	heading: ReactNode;
	headingId: string;
	children: ReactNode;
};

const EffectTileGroup = forwardRef<HTMLDivElement, EffectTileGroupProps>(function EffectTileGroup(
	{ heading, headingId, children, ...gridProps },
	ref,
) {
	return (
		<Box display='flex' flexDirection='column' style={{ gap: '0.5rem' }}>
			<Box is='span' id={headingId} fontScale='c2' color='hint'>
				{heading}
			</Box>
			<Box {...gridProps} is='div' ref={ref} className={gridStyles}>
				{children}
			</Box>
		</Box>
	);
});

export default EffectTileGroup;
