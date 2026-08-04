import type { ButtonGroupProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';

const VideoConfMessageActions = ({ children, ...props }: ButtonGroupProps) => (
	<ButtonGroup {...props} align='end'>
		{children}
	</ButtonGroup>
);

export default VideoConfMessageActions;
