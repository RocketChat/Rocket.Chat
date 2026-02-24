import { BaseAvatar } from '@rocket.chat/ui-avatar';
import type { ReactElement } from 'react';
import { memo } from 'react';

// Memoized to prevent re-renders when parent updates but URL hasn't changed
const AttachmentAuthorAvatar = memo(({ url }: { url: string }): ReactElement => <BaseAvatar url={url} size='x24' />);

export default AttachmentAuthorAvatar;
