import { css } from '@rocket.chat/css-in-js';
import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import { styled, View, type GetProps } from '@tamagui/web';
import type { RefAttributes } from 'react';

import { toCSSColorValue } from '../../helpers/toCSSValue';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontFamily, spacing } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const resetBox = {
	flex: '0 1 auto',
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outline: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
} as const;

const ThrobberFrame = styled(View, {
	...resetBox,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	marginBlock: spacing('neg-x1'),
});

const CircleFrame = styled(View, {
	...resetBox,
	render: 'span',
	marginInline: spacing('x1'),
	animation: 'bounce 1.4s infinite ease-in-out both',
	borderRadius: '100%',
	backgroundColor: toCSSColorValue('button-background-primary-default', button.light.backgroundPrimaryDefault),

	variants: {
		disabled: {
			true: {
				backgroundColor: toCSSColorValue('button-background-secondary-default', button.light.backgroundSecondaryDefault),
			},
		},
		inheritColor: {
			true: {
				backgroundColor: 'currentColor',
			},
		},
	} as const,
});

type CircleProps = {
	circleCount: number;
	iteration: number;
	inheritColor?: boolean;
	disabled?: boolean;
} & Pick<BoxProps, 'size'>;

function Circle({ disabled, circleCount, iteration, inheritColor, ...props }: CircleProps) {
	const frameProps = useTamaguiBoxProps(
		{
			className: css`
				animation-duration: ${circleCount * 0.466}s;
				animation-delay: ${iteration * 0.16}s;
			`,
			...props,
		},
		['rcx-throbber__circle', disabled && 'rcx-throbber__circle--disabled', inheritColor && 'rcx-throbber__circle--inherit-color']
			.filter(Boolean)
			.join(' '),
	);

	return <CircleFrame disabled={disabled} inheritColor={inheritColor} {...frameProps} />;
}

export type ThrobberProps = Omit<BoxProps, 'ref' | 'disabled'> &
	RefAttributes<HTMLElement> & {
		circleCount?: number;
		disabled?: boolean;
		inheritColor?: boolean;
	};

/**
 * Indicates content that has not loaded yet.
 */
function Throbber({ disabled, size = 'x16', circleCount = 3, inheritColor, ...props }: ThrobberProps) {
	const frameProps = useTamaguiBoxProps(props, 'rcx-throbber');

	return (
		<ThrobberFrame {...(frameProps as GetProps<typeof ThrobberFrame>)}>
			{Array.from({ length: circleCount || 3 }, (_, iteration) => (
				<Circle
					key={iteration}
					circleCount={circleCount}
					iteration={iteration}
					disabled={!!disabled}
					size={size}
					inheritColor={!!inheritColor}
				/>
			))}
		</ThrobberFrame>
	);
}

export default withFuselageProvider(Throbber, { takesBoxTransforms: true });
