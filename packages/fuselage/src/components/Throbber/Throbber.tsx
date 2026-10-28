import type { CSSProperties } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';

type CircleProps = {
	circleCount: number;
	iteration: number;
	inheritColor?: boolean;
	disabled?: boolean;
} & Pick<BoxProps, 'size'>;

function Circle({ disabled, circleCount, iteration, inheritColor, ...props }: CircleProps) {
	return (
		<Box
			is='span'
			style={{ '--throbber-duration': `${circleCount * 0.466}s`, '--throbber-delay': `${iteration * 0.16}s` } as CSSProperties}
			rcx-throbber__circle
			rcx-throbber__circle--disabled={disabled}
			rcx-throbber__circle--inherit-color={inheritColor}
			{...props}
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
function Throbber({ disabled, size = 'x16', circleCount = 3, inheritColor, ...props }: ThrobberProps) {
	return (
		<Box rcx-throbber {...props}>
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
		</Box>
	);
}

export default Throbber;
