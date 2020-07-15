import React from 'react';

import { renderEmoji } from '../../../app/emoji/client/index';

function Emoji({ emojiHandle }) {
	const markup = { __html: `${ renderEmoji(emojiHandle) }` };
	console.log(markup);
	return <div dangerouslySetInnerHTML={ markup }></div>;
}

export default Emoji;
