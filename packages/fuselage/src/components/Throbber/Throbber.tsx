import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';
import Circle from './Circle';

export type ThrobberProps = ElementProps<HTMLElement> & {
	/** Size of each circle. */
	size?: BoxProps['size'];
	circleCount?: number;
	/** Uses gray circles instead of the primary color. */
	disabled?: boolean;
	/** Colors the circles like the text around them, for a throbber on a colored surface such as a `primary` button. */
	inheritColor?: boolean;
};

/** Shows that something is in progress, such as content that has not loaded yet. */
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
