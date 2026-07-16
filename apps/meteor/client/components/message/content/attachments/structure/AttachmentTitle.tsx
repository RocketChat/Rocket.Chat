import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentTitleProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentTitle = (props: AttachmentTitleProps) => <Box withTruncatedText marginInline={2} fontScale='c1' color='hint' {...props} />;

export default AttachmentTitle;
