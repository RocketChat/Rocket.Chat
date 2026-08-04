import type { IconButtonProps } from '@rocket.chat/fuselage';
import { IconButton } from '@rocket.chat/fuselage';

export type VideoConfMessageActionProps = IconButtonProps;

const VideoConfMessageAction = ({ icon = 'info', ...props }: VideoConfMessageActionProps) => <IconButton {...props} icon={icon} small />;
export default VideoConfMessageAction;
