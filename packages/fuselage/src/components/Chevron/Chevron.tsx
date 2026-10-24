import { styled, View, type GetProps } from '@tamagui/web';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { cx } from '../../helpers/composeClassNames';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon } from '../Icon';

const ChevronFrame = styled(View, {
	render: 'span',
	display: 'inline-flex',
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	alignSelf: 'center',

	variants: {
		rotation: {
			up: { transform: 'rotate(-180deg)' },
			down: { transform: 'rotate(0deg)' },
			right: { transform: 'rotate(-90deg)' },
			left: { transform: 'rotate(-270deg)' },
		},
	} as const,
});

export type ChevronProps = ElementProps<HTMLSpanElement> & {
	size?: BoxProps['width'];
	up?: boolean;
	right?: boolean;
	left?: boolean;
	down?: boolean;
	top?: boolean;
	bottom?: boolean;
};

function Chevron({ up, right, down, left, size, className, ...props }: ChevronProps): ReactElement<ChevronProps> {
	const children = useMemo(() => <Icon name='chevron-down' size={size} />, [size]);

	// Same precedence as the stylesheet had, where the last rule declared won
	const rotation = (left && 'left') || (right && 'right') || (down && 'down') || (up && 'up') || undefined;

	return (
		<ChevronFrame
			rotation={rotation}
			{...(props as GetProps<typeof ChevronFrame>)}
			className={cx(
				'rcx-chevron',
				up && 'rcx-chevron--up',
				right && 'rcx-chevron--right',
				down && 'rcx-chevron--down',
				left && 'rcx-chevron--left',
				className,
			)}
		>
			{children}
		</ChevronFrame>
	);
}

export default withFuselageProvider(Chevron);
