import type { ReactElement } from 'react';
import { memo } from 'react';

type PreviewChannelMentionElementProps = {
	mention: string;
};

const PreviewChannelMentionElement = ({ mention }: PreviewChannelMentionElementProps): ReactElement => <>#{mention}</>;

export default memo(PreviewChannelMentionElement);
