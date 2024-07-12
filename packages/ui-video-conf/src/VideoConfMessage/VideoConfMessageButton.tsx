import { Button } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes, ReactElement } from 'react';

const VideoConfMessageButton = ({
	primary,
	...props
}: { primary?: boolean } & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>): ReactElement => (
	<Button {...props} mi={4} small primary={primary} />
);
export default VideoConfMessageButton;
