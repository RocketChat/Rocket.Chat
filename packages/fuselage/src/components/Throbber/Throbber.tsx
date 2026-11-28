import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';
import Circle from './Circle';

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
