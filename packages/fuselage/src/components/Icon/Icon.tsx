import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { CSSProperties } from 'react';

import { statusColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { resolveFontScale, size as sizeToken } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

type FontColor<T> = T extends `font-${infer Color}` ? Color : never;

/** A semantic text or status font token. */
export type IconColor = FontColor<keyof typeof textIconColors> | keyof typeof statusColors;

const glyphColors = Object.fromEntries([
	...Object.entries(textIconColors).flatMap(([name, value]) =>
		name.startsWith('font-') ? [[name.slice(5), { color: String(value) }]] : [],
	),
	...Object.entries(statusColors).map(([name, value]) => [name, { color: String(value) }]),
]) as Record<IconColor, { color: string }>;

export const IconFrame = styled(Text, {
	render: 'i',
	display: 'inline-block',
	flexShrink: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	userSelect: 'none',
	verticalAlign: 'text-bottom',
	letterSpacing: 0,
	fontFamily: 'RocketChat',
	// A caller's size travels as a custom property, so the frame's styles stay static and app CSS can still override them
	fontSize: 'var(--rcx-icon-size, inherit)',
	fontWeight: '400',
	fontStyle: 'normal',
	fontVariant: 'normal',
	lineHeight: '1',
	textRendering: 'auto',

	variants: {
		glyphColor: glyphColors,
	} as const,
});

export type IconProps = ElementProps<HTMLElement> & {
	name: IconName;
	size?: BoxProps['width'];
	/** The colour of the glyph; without it, the icon takes the colour of the text around it. */
	color?: IconColor;
};

function Icon({ name, size, color, className, style, ...props }: IconProps) {
	return (
		<IconFrame
			aria-hidden
			style={{ ...style, '--rcx-icon-size': resolveFontScale(size)?.fontSize ?? sizeToken(size) } as CSSProperties}
			glyphColor={color}
			{...(props as GetProps<typeof IconFrame>)}
			className={cx('rcx-icon', `rcx-icon--name-${name}`, className)}
		>
			{nameToCharacterMapping[name]}
		</IconFrame>
	);
}

export default withFuselageProvider(Icon, { takesBoxTransforms: true });
