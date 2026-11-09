import type { CSSProperties, ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps.js';
import { Box, type BoxProps } from '../Box/index.js';

export type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: BoxProps['height'];
	children: ReactNode;
} & ElementProps<HTMLDivElement>;

const CardBody = ({ children, flexDirection, height, ...props }: CardBodyProps) => (
	<Box rcx-card__body flexDirection={flexDirection} height={height} {...props}>
		{children}
	</Box>
);

export default CardBody;
