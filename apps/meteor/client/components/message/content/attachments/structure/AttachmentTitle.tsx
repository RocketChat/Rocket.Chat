import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentTitleProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentTitle = (props: AttachmentTitleProps) => <Box withTruncatedText mi={2} fontScale='c1' color='hint' {...props} />;

export default AttachmentTitle;
