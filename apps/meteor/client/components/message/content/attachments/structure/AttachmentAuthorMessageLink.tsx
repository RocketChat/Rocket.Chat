import { Box } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef } from 'react';

type AttachmentAuthorMessageLinkProps = ComponentPropsWithoutRef<typeof Box>;

const AttachmentAuthorMessageLink = (props: AttachmentAuthorMessageLinkProps) => <Box is='a' fontScale='c1' {...props} />;

export default AttachmentAuthorMessageLink;
