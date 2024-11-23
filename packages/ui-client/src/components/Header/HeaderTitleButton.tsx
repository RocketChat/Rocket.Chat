import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const HeaderTitleButton = ({ className, ...props }: { className?: string } & ComponentProps<typeof Box>) => {
	const customClass = css`
		border-width: 1px;
		border-style: solid;
		border-color: transparent;

		&:hover {
			cursor: pointer;
			background-color: ${Palette.surface['surface-hover']};
		}
		&:focus.focus-visible {
			outline: 0;
			box-shadow: 0 0 0 2px ${Palette.stroke['stroke-extra-light-highlight']};
			border-color: ${Palette.stroke['stroke-highlight']};
		}
	`;

	return <Box display='flex' alignItems='center' borderRadius={4} withTruncatedText className={[customClass, className]} {...props} />;
};

export default HeaderTitleButton;
