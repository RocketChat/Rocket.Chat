import type { ReactElement } from 'react';
import { memo } from 'react';

import { mentionClassName, mentionStyle } from './mentionStyle.js';

type ComposerMentionChannelProps = {
	mention: string;
};

const className = mentionClassName('link');
const style = mentionStyle('link');

const ComposerMentionChannel = ({ mention }: ComposerMentionChannelProps): ReactElement => (
	<span className={className} style={style}>
		#{mention}
	</span>
);

export default memo(ComposerMentionChannel);
