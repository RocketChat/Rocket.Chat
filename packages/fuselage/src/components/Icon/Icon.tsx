import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type IconProps = Omit<BoxProps, 'ref' | 'name' | 'size'> &
	RefAttributes<HTMLElement> & {
		name: IconName;
		size?: BoxProps['width'];
	};

function Icon({ name, size, ...props }: IconProps) {
	return (
		<Box is='i' rcx-icon rcx-icon--name={name} aria-hidden='true' fontSize={size} {...props}>
			{nameToCharacterMapping[name]}
		</Box>
	);
}

export default Icon;
