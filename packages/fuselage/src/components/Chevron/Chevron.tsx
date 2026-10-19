import { styled, View, type GetProps } from '@tamagui/web';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
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

export type ChevronProps = Omit<BoxProps, 'size'> & {
	size?: BoxProps['width'];
	up?: boolean;
	right?: boolean;
	left?: boolean;
	down?: boolean;
	top?: boolean;
	bottom?: boolean;
};

function Chevron({ up, right, down, left, size, ...props }: ChevronProps): ReactElement<ChevronProps> {
	const children = useMemo(() => <Icon name='chevron-down' size={size} />, [size]);

	const frameProps = useTamaguiBoxProps({
		'rcx-chevron': true,
		'rcx-chevron--up': up,
		'rcx-chevron--right': right,
		'rcx-chevron--down': down,
		'rcx-chevron--left': left,
		...props,
	});

	// Same precedence as the stylesheet had, where the last rule declared won
	const rotation = (left && 'left') || (right && 'right') || (down && 'down') || (up && 'up') || undefined;

	return (
		<ChevronFrame rotation={rotation} {...(frameProps as GetProps<typeof ChevronFrame>)}>
			{children}
		</ChevronFrame>
	);
}

export default withFuselageProvider(Chevron);
