import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

export type AttachmentAuthorNameProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorName = (props: AttachmentAuthorNameProps) => <Box withTruncatedText fontScale='p2m' mi={8} {...props} />;

export default AttachmentAuthorName;
