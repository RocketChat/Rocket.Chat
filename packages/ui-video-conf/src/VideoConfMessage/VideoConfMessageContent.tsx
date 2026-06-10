import { Box } from '@rocket.chat/fuselage';
import type { AllHTMLAttributes } from 'react';

type VideoConfMessageContentProps = Omit<AllHTMLAttributes<HTMLDivElement>, 'is'>;

const VideoConfMessageContent = (props: VideoConfMessageContentProps) => <Box display='flex' alignItems='center' {...props} />;

export default VideoConfMessageContent;
