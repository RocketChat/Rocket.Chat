import type { ReactElement } from 'react';
import { memo } from 'react';

import { mentionClassName, mentionStyle } from './mentionStyle.js';

type ComposerMentionUserProps = {
	mention: string;
};

// TODO: Once implemented add mention resolution logic
const ComposerMentionUser = ({ mention }: ComposerMentionUserProps): ReactElement => {
	const variant = mention === 'all' || mention === 'here' ? 'relevant' : 'other';

	return (
		<span className={mentionClassName(variant)} style={mentionStyle(variant)}>
			@{mention}
		</span>
	);
};

export default memo(ComposerMentionUser);
