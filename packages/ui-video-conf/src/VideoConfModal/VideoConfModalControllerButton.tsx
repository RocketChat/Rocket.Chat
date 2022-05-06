import React from 'react';
import type { ReactElement, ButtonHTMLAttributes } from 'react';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { IconProps } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';

type VideoConfModalControllerButtonProps = {
	icon: IconProps['name'];
	primary?: boolean;
	text: string;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

/**
 * @deprecated
 * In favor of CallController
*/

const VideoConfModalControllerButton = ({ primary, text, icon, ...props }: VideoConfModalControllerButtonProps): ReactElement => {
	const id = useUniqueId();
	return (
		<>
			<Button id={id} square primary={primary} {...props}>
				<Icon size='x20' name={icon} />
			</Button>
			<Box is='label' htmlFor={id} mbs='x8' fontScale='c1' color='neutral-700' {...props}>
				{text}
			</Box>
		</>
	);
};

export default VideoConfModalControllerButton;
