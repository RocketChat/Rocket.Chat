import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { RefAttributes } from 'react';

import type { statusColors, textIconColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { useBoxTransform } from '../Box/BoxTransforms';
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

export type IconProps = Omit<BoxProps, 'ref' | 'name' | 'size' | 'color'> &
	RefAttributes<HTMLElement> & {
		name: IconName;
		size?: BoxProps['width'];
		/** The colour of the glyph; without it, the icon takes the colour of the text around it. */
		color?: IconColor;
	};

function Icon({ name, size, ...props }: IconProps) {
	const transformFn = useBoxTransform();
	const boxProps = { 'rcx-icon': true, 'rcx-icon--name': name, 'fontSize': size, ...props };
	const frameProps = useTamaguiBoxProps(transformFn ? transformFn(boxProps) : boxProps);

	return (
		<IconFrame aria-hidden {...(frameProps as GetProps<typeof IconFrame>)}>
			{nameToCharacterMapping[name]}
		</IconFrame>
	);
}

export default withFuselageProvider(Icon);
