import { css } from '@rocket.chat/css-in-js';
import type { RefAttributes } from 'react';

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
			className={css`
				animation-duration: ${circleCount * 0.466}s;
				animation-delay: ${iteration * 0.16}s;
			`}
			rcx-throbber__circle
			rcx-throbber__circle--disabled={disabled}
			rcx-throbber__circle--inherit-color={inheritColor}
			{...props}
		/>
	);
}

export type ThrobberProps = Omit<BoxProps, 'ref' | 'disabled'> &
	RefAttributes<HTMLElement> & {
		circleCount?: number;
		disabled?: boolean;
		inheritColor?: boolean;
	};

/**
 * Indicates content that has not loaded yet.
 */
// eslint-disable-next-line react/no-multi-comp
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
