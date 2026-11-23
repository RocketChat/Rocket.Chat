import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const gridStyles = css`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 0.5rem;
`;

type BackgroundTileGridProps = { label: string; children: ReactNode };

const BackgroundTileGrid = ({ label, children }: BackgroundTileGridProps) => (
	<Box role='group' aria-label={label} className={gridStyles}>
		{children}
	</Box>
);

export default BackgroundTileGrid;
