import { memo } from 'react';

export type PreviewUserMentionElementProps = {
	mention: string;
};

const PreviewUserMentionElement = ({ mention }: PreviewUserMentionElementProps) => <>@{mention}</>;

export default memo(PreviewUserMentionElement);
