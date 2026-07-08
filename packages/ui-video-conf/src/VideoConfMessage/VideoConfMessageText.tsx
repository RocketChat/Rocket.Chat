import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

type VideoConfMessageTextProps = AllHTMLAttributes<HTMLParagraphElement>;

const VideoConfMessageText = (props: VideoConfMessageTextProps) => <Box {...props} is='p' fontScale='c2' mis={8} />;

export default VideoConfMessageText;
