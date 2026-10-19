import { css } from '@rocket.chat/css-in-js';

import { Box, type BoxProps } from '../Box';

type ThrobberCircleProps = {
	circleCount: number;
	iteration: number;
	inheritColor?: boolean;
	disabled?: boolean;
} & Pick<BoxProps, 'size'>;

function ThrobberCircle({ disabled, circleCount, iteration, inheritColor, ...props }: ThrobberCircleProps) {
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

export default ThrobberCircle;
