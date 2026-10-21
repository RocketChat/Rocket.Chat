import type { AllHTMLAttributes, CSSProperties, ReactNode } from 'react';

import { Box, type BoxProps } from '../Box';

export type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: BoxProps['height'];
	children: ReactNode;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const CardBody = ({ children, flexDirection = 'row', height, ...props }: CardBodyProps) => (
	<Box fontScale='p2m' display='flex' flexDirection={flexDirection} flexGrow={1} height={height} rcx-card__body {...props}>
		{children}
	</Box>
);

export default CardBody;
