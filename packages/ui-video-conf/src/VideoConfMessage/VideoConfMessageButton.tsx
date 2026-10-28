import { Button, type ButtonProps } from '@rocket.chat/fuselage';
import type { ButtonHTMLAttributes } from 'react';

export type VideoConfMessageButtonProps = Pick<ButtonProps, 'variant'> & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'is'>;

const VideoConfMessageButton = ({ variant, ...props }: VideoConfMessageButtonProps) => <Button {...props} size='small' variant={variant} />;
export default VideoConfMessageButton;
