import type { ButtonGroupProps } from '@rocket.chat/fuselage';
import { ButtonGroup } from '@rocket.chat/fuselage';

export type VideoConfMessageActionsProps = ButtonGroupProps;

const VideoConfMessageActions = ({ children, ...props }: VideoConfMessageActionsProps) => (
	<ButtonGroup {...props} align='end'>
		{children}
	</ButtonGroup>
);

export default VideoConfMessageActions;
