import { css } from '@rocket.chat/css-in-js';
import type { IconProps } from '@rocket.chat/fuselage';
import { Icon, Box } from '@rocket.chat/fuselage';

export type CreateNewScreenButtonProps = {
	size?: IconProps['size'];
} & IconProps;

const CreateNewScreenButton = ({ size = '60px', name = 'plus', ...props }: CreateNewScreenButtonProps) => {
	return (
		<Box width={size} height={size}>
			<Icon
				{...props}
				size={size}
				name={name}
				className={css`
					cursor: pointer;
					transition: var(--animation-default);
					&:hover {
						scale: 1.1;
						transition: var(--animation-default);
					}
				`}
			/>
		</Box>
	);
};

export default CreateNewScreenButton;
