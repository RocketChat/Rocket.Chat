import { BaseAvatar } from '@rocket.chat/ui-avatar';

export type AttachmentAuthorAvatarProps = { url: string };

const AttachmentAuthorAvatar = ({ url }: AttachmentAuthorAvatarProps) => <BaseAvatar url={url} size='x24' />;

export default AttachmentAuthorAvatar;
