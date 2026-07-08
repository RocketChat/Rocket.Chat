import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentAuthorTimestampProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorTimestamp = (props: AttachmentAuthorTimestampProps) => <Box fontScale='c1' {...props} />;

export default AttachmentAuthorTimestamp;
