import type { ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

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
