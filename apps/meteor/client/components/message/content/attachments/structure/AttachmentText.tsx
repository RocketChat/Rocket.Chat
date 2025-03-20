import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentTextProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentText = (props: AttachmentTextProps) => <Box mbe={4} mi={2} fontScale='p2' color='default' {...props} />;

export default AttachmentText;
