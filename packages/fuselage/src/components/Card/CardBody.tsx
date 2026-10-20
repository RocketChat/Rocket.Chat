import type { GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, CSSProperties, ReactNode } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { CardText } from './CardFrames';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: BoxProps['height'];
	children: ReactNode;
} & Omit<AllHTMLAttributes<HTMLElement>, 'is'>;

const CardBody = ({ children, flexDirection = 'row', height, ...props }: CardBodyProps) => {
	const bodyProps = useTamaguiBoxProps({
		'fontScale': 'p2m',
		'display': 'flex',
		flexDirection,
		'flexGrow': 1,
		height,
		'rcx-card__body': true,
		...props,
	});

	return <CardText {...(bodyProps as GetProps<typeof CardText>)}>{children}</CardText>;
};

export default withFuselageProvider(CardBody, { takesBoxTransforms: true });
