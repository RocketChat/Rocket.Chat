import type { CSSProperties } from 'react';

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

export default Circle;
