import { css } from '@rocket.chat/css-in-js';
import { Icon, Box, useStyle } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const CreateNewScreenButton = ({
	size = '60px',
	name = 'plus',
	...props
}: {
	size?: ComponentProps<typeof Icon>['size'];
} & ComponentProps<typeof Icon>) => {
	const hoverClassName = useStyle(css`
		cursor: pointer;
		transition: var(--animation-default);
		&:hover {
			scale: 1.1;
			transition: var(--animation-default);
		}
	`);

	return (
		<Box width={size} height={size}>
			<Icon {...props} size={size} name={name} className={hoverClassName} />
		</Box>
	);
};

export default CreateNewScreenButton;
