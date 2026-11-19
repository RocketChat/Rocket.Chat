import { Button, type ButtonProps } from '@rocket.chat/fuselage';

export type VideoConfMessageButtonProps = Omit<ButtonProps, 'is' | 'size'>;

const VideoConfMessageButton = ({ variant, ...props }: VideoConfMessageButtonProps) => <Button {...props} size='small' variant={variant} />;
export default VideoConfMessageButton;
