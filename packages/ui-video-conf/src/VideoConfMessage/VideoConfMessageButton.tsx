import { Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

type VideoConfMessageButtonProps = { primary?: boolean } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const VideoConfMessageButton = ({ primary, ...props }: VideoConfMessageButtonProps): ReactElement => (
	<Button {...props} mi={4} small primary={primary} />
);
export default VideoConfMessageButton;
