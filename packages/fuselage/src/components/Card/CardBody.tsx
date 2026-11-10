import type { CSSProperties, ReactNode } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

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
