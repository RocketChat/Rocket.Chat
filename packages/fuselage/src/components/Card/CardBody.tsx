import type { GetProps } from '@tamagui/web';
import type { CSSProperties, ReactNode } from 'react';

import { CardText } from './CardFrames';
import { cx } from '../../helpers/composeClassNames';
import { fontScale, size } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: BoxProps['height'];
	children: ReactNode;
} & ElementProps<HTMLDivElement>;

const CardBody = ({ children, flexDirection = 'row', height, className, ...props }: CardBodyProps) => (
	<CardText
		{...fontScale('p2m')}
		flexDirection={flexDirection}
		flexGrow={1}
		height={size(height)}
		{...(props as GetProps<typeof CardText>)}
		className={cx('rcx-card__body', className)}
	>
		{children}
	</CardText>
);

export default withFuselageProvider(CardBody);
