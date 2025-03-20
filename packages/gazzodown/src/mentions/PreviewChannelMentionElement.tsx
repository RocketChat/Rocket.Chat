import { memo, ReactElement } from 'react';

type PreviewChannelMentionElementProps = {
	mention: string;
};

const PreviewChannelMentionElement = ({ mention }: PreviewChannelMentionElementProps): ReactElement => <>#{mention}</>;

export default memo(PreviewChannelMentionElement);
