import { memo } from 'react';

type PreviewUserMentionElementProps = {
	mention: string;
};

const PreviewUserMentionElement = ({ mention }: PreviewUserMentionElementProps) => <>@{mention}</>;

export default memo(PreviewUserMentionElement);
