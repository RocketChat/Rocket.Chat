import React from 'react';

import { renderEmoji } from '../lib/renderEmoji';

function Emoji({ emojiHandle, className = undefined }) {
	const markup = { __html: `${renderEmoji(emojiHandle)}` };
	return <span className={className} dangerouslySetInnerHTML={markup} />;
}

export default Emoji;
