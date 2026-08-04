import type { IconButtonProps } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';

const VideoConfMessageAction = ({ icon = 'info', ...props }: IconButtonProps) => <IconButton {...props} icon={icon} small />;
export default VideoConfMessageAction;
