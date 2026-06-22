import { memo } from 'react';

type PreviewChannelMentionElementProps = {
	mention: string;
};

const PreviewChannelMentionElement = ({ mention }: PreviewChannelMentionElementProps) => <>#{mention}</>;

export default memo(PreviewChannelMentionElement);
