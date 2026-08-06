import { Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

export type VideoConfMessageButtonProps = { primary?: boolean; size?: string } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is' | 'size'>;

const VideoConfMessageButton = ({ primary, ...props }: VideoConfMessageButtonProps) => (
	<Button {...props} marginInline={4} size='small' variant={primary ? 'primary' : undefined} />
);
export default VideoConfMessageButton;
