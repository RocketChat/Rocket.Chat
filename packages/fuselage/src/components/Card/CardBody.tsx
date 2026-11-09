import type { ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type CardBodyProps = {
	flexDirection?: 'row' | 'column';
	height?: 'full';
	children: ReactNode;
} & ElementProps<HTMLDivElement>;

const CardBody = ({ children, flexDirection, height, ...props }: CardBodyProps) => (
	<Box rcx-card__body flexDirection={flexDirection} height={height} {...props}>
		{children}
	</Box>
);

export default CardBody;
