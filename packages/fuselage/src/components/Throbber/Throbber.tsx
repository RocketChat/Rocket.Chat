import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import { styled, View, type GetProps } from '@tamagui/web';
import type { CSSProperties } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { toCSSColorValue } from '../../helpers/toCSSValue';
import { fontFamily, size as sizeToken, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
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

function Circle({ disabled, circleCount, iteration, inheritColor, size }: CircleProps) {
	return (
		<CircleFrame
			style={{ '--throbber-duration': `${circleCount * 0.466}s`, '--throbber-delay': `${iteration * 0.16}s` } as CSSProperties}
			disabled={disabled}
			inheritColor={inheritColor}
			width={sizeToken(size)}
			height={sizeToken(size)}
			className={cx(
				'rcx-throbber__circle',
				disabled && 'rcx-throbber__circle--disabled',
				inheritColor && 'rcx-throbber__circle--inherit-color',
			)}
		/>
	);
}

export type ThrobberProps = ElementProps<HTMLElement> & {
	size?: BoxProps['size'];
	circleCount?: number;
	disabled?: boolean;
	inheritColor?: boolean;
};

/**
 * Indicates content that has not loaded yet.
 */
function Throbber({ disabled, size = 'x16', circleCount = 3, inheritColor, className, ...props }: ThrobberProps) {
	return (
		<ThrobberFrame {...(props as GetProps<typeof ThrobberFrame>)} className={cx('rcx-throbber', className)}>
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

export default withFuselageProvider(Throbber);
