import type { ReactElement } from 'react';
import { memo } from 'react';

type ComposerMentionChannelProps = {
	mention: string;
};

const className = 'rcx-message__highlight rcx-message__highlight--link';

const ComposerMentionChannel = ({ mention }: ComposerMentionChannelProps): ReactElement => <span className={className}>#{mention}</span>;

export default memo(ComposerMentionChannel);
