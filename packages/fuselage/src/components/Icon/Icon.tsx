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
	/** Size of the glyph: a size token such as `x20`, or a number of pixels; without it, the font size around it. */
	size?: BoxProps['width'];
	/** The colour of the glyph; without it, the icon takes the colour of the text around it. */
	color?: IconColor;
};

/** A glyph from the Fuselage icon set. It is hidden from assistive technology, so text nearby must carry its meaning. */
function Icon({ name, size, ...props }: IconProps) {
	return (
		<Box is='i' rcx-icon rcx-icon--name={name} aria-hidden='true' fontSize={size} {...props}>
			{nameToCharacterMapping[name]}
		</Box>
	);
}

export default Icon;
