import { css } from '@rocket.chat/css-in-js';
import { Box, Stack, Text } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode, Ref } from 'react';

const gridStyles = css`
	grid-template-columns: repeat(3, minmax(0, 1fr));
	outline: none;
`;

export type EffectTileGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'is' | 'color'> & {
	ref?: Ref<HTMLDivElement>;
	heading: ReactNode;
	headingId: string;
	children: ReactNode;
};

const EffectTileGroup = ({ ref, heading, headingId, children, ...gridProps }: EffectTileGroupProps) => (
	<Stack gap={8}>
		<Text is='span' id={headingId} fontScale='c2' color='hint'>
			{heading}
		</Text>
		<Box {...gridProps} ref={ref} className={gridStyles} display='grid' gap={12}>
			{children}
		</Box>
	</Stack>
);

export default EffectTileGroup;
