import { styled, type GetProps } from '@tamagui/web';
import type { CSSProperties, ReactNode } from 'react';

import { CardText } from './CardFrames';
import { cx } from '../../helpers/composeClassNames';
import { fontScale, size } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const CardBodyFrame = styled(CardText, {
	...fontScale('p2m'),
	flexGrow: 1,
	// A caller's height travels as a custom property, so the frame's styles stay static and app CSS can still override them
	height: 'var(--rcx-card-body-height, auto)',

	variants: {
		direction: {
			'row': { flexDirection: 'row' },
			'row-reverse': { flexDirection: 'row-reverse' },
			'column': { flexDirection: 'column' },
			'column-reverse': { flexDirection: 'column-reverse' },
		},
	} as const,
});

export type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: BoxProps['height'];
	children: ReactNode;
} & ElementProps<HTMLDivElement>;

const CardBody = ({ children, flexDirection = 'row', height, className, style, ...props }: CardBodyProps) => (
	<CardBodyFrame
		direction={flexDirection as GetProps<typeof CardBodyFrame>['direction']}
		style={{ ...style, '--rcx-card-body-height': size(height) } as CSSProperties}
		{...(props as GetProps<typeof CardBodyFrame>)}
		className={cx('rcx-card__body', className)}
	>
		{children}
	</CardBodyFrame>
);

export default withFuselageProvider(CardBody);
