import { Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

type VideoConfMessageButtonProps = { primary?: boolean } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const VideoConfMessageButton = ({ primary, ...props }: VideoConfMessageButtonProps) => <Button {...props} mi={4} small primary={primary} />;
export default VideoConfMessageButton;
