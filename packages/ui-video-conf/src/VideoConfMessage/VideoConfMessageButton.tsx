import { Button } from '@rocket.chat/fuselage';
import type { ButtonHTMLAttributes } from 'react';

export type VideoConfMessageButtonProps = { primary?: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'is'>;

const VideoConfMessageButton = ({ primary, ...props }: VideoConfMessageButtonProps) => (
	<Button {...props} size='small' variant={primary ? 'primary' : undefined} />
);
export default VideoConfMessageButton;
