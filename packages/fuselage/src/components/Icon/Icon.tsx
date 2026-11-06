import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';

import type { statusColors, textIconColors } from '../../Theme';
import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

type FontColor<T> = T extends `font-${infer Color}` ? Color : never;

/** A semantic text or status font token. */
export type IconColor = FontColor<keyof typeof textIconColors> | keyof typeof statusColors;

export type IconProps = ElementProps<HTMLElement> & {
	name: IconName;
	size?: BoxProps['width'];
	/** The colour of the glyph; without it, the icon takes the colour of the text around it. */
	color?: IconColor;
};

function Icon({ name, size, ...props }: IconProps) {
	return (
		<Box is='i' rcx-icon rcx-icon--name={name} aria-hidden='true' fontSize={size} {...props}>
			{nameToCharacterMapping[name]}
		</Box>
	);
}

export default Icon;
