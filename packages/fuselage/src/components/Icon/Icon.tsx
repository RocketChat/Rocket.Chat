import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import { styled, Text, type GetProps } from '@tamagui/web';

import type { statusColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { resolveFontColor, resolveFontScale, size as sizeToken } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

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
	fontSize: 'inherit',
	fontWeight: '400',
	fontStyle: 'normal',
	fontVariant: 'normal',
	lineHeight: '1',
	textRendering: 'auto',
});

type FontColor<T> = T extends `font-${infer Color}` ? Color : never;

/** A semantic text or status font token. */
export type IconColor = FontColor<keyof typeof textIconColors> | keyof typeof statusColors;

export type IconProps = ElementProps<HTMLElement> & {
	name: IconName;
	size?: BoxProps['width'];
	/** The colour of the glyph; without it, the icon takes the colour of the text around it. */
	color?: IconColor;
};

function Icon({ name, size, color, className, ...props }: IconProps) {
	return (
		<IconFrame
			aria-hidden
			fontSize={resolveFontScale(size)?.fontSize ?? sizeToken(size)}
			color={color && resolveFontColor(color)}
			{...(props as GetProps<typeof IconFrame>)}
			className={cx('rcx-icon', `rcx-icon--name-${name}`, className)}
		>
			{nameToCharacterMapping[name]}
		</IconFrame>
	);
}

export default withFuselageProvider(Icon, { takesBoxTransforms: true });
