import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';
import ThrobberCircle from './ThrobberCircle';

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
	return (
		<Box rcx-throbber {...props}>
			{Array.from({ length: circleCount || 3 }, (_, iteration) => (
				<ThrobberCircle
					key={iteration}
					circleCount={circleCount}
					iteration={iteration}
					disabled={!!disabled}
					size={size}
					inheritColor={!!inheritColor}
				/>
			))}
		</Box>
	);
}

export default Throbber;
