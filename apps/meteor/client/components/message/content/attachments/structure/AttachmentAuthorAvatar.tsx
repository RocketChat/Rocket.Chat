import { BaseAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';

const AttachmentAuthorAvatar = ({ url }: { url: string }): ReactElement => <BaseAvatar url={url} size='x24' />;

export default AttachmentAuthorAvatar;
