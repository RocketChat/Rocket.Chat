import buttonTokens from '@rocket.chat/fuselage-tokens/dist/button.json';
import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { strokeColors, textIconColors, Var } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import { Avatar } from '../Avatar';
import { Box } from '../Box';
import { withBoxStyling } from '../Box/withBoxStyling';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Icon } from '../Icon';
import { Margins } from '../Margins';

const button = (name: string, token: keyof (typeof buttonTokens)['light']) => new Var(`button-${name}`, buttonTokens.light[token]);

const ChipFrame = styled(View, {
	render: 'button',
	display: 'flex',
	flexDirection: 'row',
	overflow: 'hidden',
	alignItems: 'center',
	minWidth: 'auto',
	minHeight: size('x28'),
	margin: spacing('none'),
	padding: spacing('none'),
	borderWidth: 0,
	borderStyle: 'solid',
	borderRadius: toCSSValue('--rcx-button-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!)),
	outline: 'none',
	cursor: 'pointer',
	appearance: 'none',
	fontFamily: fontFamily('sans'),
	...fontScale('p2'),
	color: toCSSValue('--rcx-chip-color', textIconColors['font-secondary-info']),
	borderColor: {
		'default': toCSSValue('--rcx-chip-border-color', button('background-secondary-default', 'backgroundSecondaryDefault')),
		'focus-visible': toCSSValue('--rcx-chip-focus-border-color', strokeColors['stroke-extra-dark']),
		'hover': toCSSValue('--rcx-chip-hover-border-color', button('background-secondary-hover', 'backgroundSecondaryHover')),
		'press': toCSSValue('--rcx-chip-active-border-color', button('background-secondary-press', 'backgroundSecondaryPress')),
	},
	backgroundColor: {
		'default': toCSSValue('--rcx-chip-background-color', button('background-secondary-default', 'backgroundSecondaryDefault')),
		'focus-visible': toCSSValue('--rcx-chip-focus-background-color', button('background-secondary-focus', 'backgroundSecondaryFocus')),
		'hover': toCSSValue('--rcx-chip-hover-background-color', button('background-secondary-hover', 'backgroundSecondaryHover')),
		'press': toCSSValue('--rcx-chip-active-background-color', button('background-secondary-press', 'backgroundSecondaryPress')),
	},
	boxShadow: {
		'focus-visible': `0 0 0 ${borderWidth('medium')} ${toCSSValue('--rcx-chip-focus-shadow-color', strokeColors['stroke-extra-light-highlight'])}`,
		'hover': 'none',
		'press': 'none',
	},

	variants: {
		// Not `disabled`: Tamagui would add `aria-disabled`, so the frame gets the attribute through `render` instead
		inactive: {
			true: {
				cursor: 'not-allowed',
				color: toCSSValue('--rcx-button-secondary-color', button('font-on-secondary', 'fontOnSecondary')),
				borderColor: toCSSValue(
					'--rcx-button-secondary-border-color',
					button('background-secondary-default', 'backgroundSecondaryDefault'),
				),
				backgroundColor: toCSSValue(
					'--rcx-button-secondary-background-color',
					button('background-secondary-default', 'backgroundSecondaryDefault'),
				),
			},
		},
	} as const,
});

const ChipText = styled(Text, {
	render: 'span',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
	thumbUrl?: string;
	renderThumb?: (props: { url: string }) => ReactNode;
	renderDismissSymbol?: () => ReactNode;
};

const defaultRenderThumb = ({ url }: { url: string }) => (
	<Box rcx-avatar display='inline-flex' verticalAlign='middle'>
		<Avatar size='x20' url={url} />
	</Box>
);
const defaultRenderDismissSymbol = () => <Icon name='cross' size='x16' />;

const Chip = (props: ChipProps) => {
	const {
		children,
		className,
		thumbUrl,
		onClick,
		onMouseDown,
		renderThumb = defaultRenderThumb,
		renderDismissSymbol = defaultRenderDismissSymbol,
		disabled: disabledProp,
		...rest
	} = props;
	const onDismiss = onClick || onMouseDown;
	const disabled = 'disabled' in props ? disabledProp : !onDismiss;

	return (
		<ChipFrame
			className={prependClassName(className, 'rcx-box rcx-chip')}
			inactive={!!disabled}
			render={disabled ? <button disabled /> : 'button'}
			{...({ type: 'button', onClick: onDismiss, ...rest } as GetProps<typeof ChipFrame>)}
		>
			<Margins all='x4'>
				{thumbUrl && renderThumb?.({ url: thumbUrl })}
				{children && <ChipText className='rcx-box rcx-chip__text'>{children}</ChipText>}
				{onDismiss && renderDismissSymbol?.()}
			</Margins>
		</ChipFrame>
	);
};

// `develop` rendered a plain `button`, which no `Margins`/`Scrollable` transform reached
export default withBoxStyling(withFuselageProvider(Chip));
