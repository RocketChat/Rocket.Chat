import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import type { CSSProperties } from 'react';

import { glyphColors, type IconColor } from './glyphColors';
import { cx } from '../../helpers/composeClassNames';
import { resolveFontScale, size as sizeToken } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/withFuselageProvider';

export type { IconColor } from './glyphColors';

export type IconProps = ElementProps<HTMLElement> & {
	name: IconName;
	size?: BoxProps['width'];
	/** The colour of the glyph; without it, the icon takes the colour of the text around it. */
	color?: IconColor;
};

/**
 * A plain element styled by `.rcx-icon`: zero-runtime can't forward `style` or a runtime size to a Tamagui frame.
 */
function Icon({ name, size, color, className, style, ...props }: IconProps) {
	return (
		<i
			aria-hidden
			{...props}
			style={
				{
					...(color && glyphColors[color]),
					...style,
					'--rcx-icon-size': resolveFontScale(size)?.fontSize ?? sizeToken(size),
				} as CSSProperties
			}
			className={cx('rcx-icon', `rcx-icon--name-${name}`, className)}
		>
			{nameToCharacterMapping[name]}
		</i>
	);
}

export default withFuselageProvider(Icon, { takesBoxTransforms: true });
