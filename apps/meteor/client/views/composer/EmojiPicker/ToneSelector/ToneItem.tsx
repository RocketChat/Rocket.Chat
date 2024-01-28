import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const ToneItem = ({ tone }: { tone: number }) => {
	let toneEmoji;

	switch (tone) {
		case 1:
			toneEmoji = '<span class="joypixels joypixels-diversity _270b-1f3fb">✋🏻</span>';
			break;
		case 2:
			toneEmoji = '<span class="joypixels joypixels-diversity _270b-1f3fc">✋🏼</span>';
			break;
		case 3:
			toneEmoji = '<span class="joypixels joypixels-diversity _270b-1f3fd">✋🏽</span>';
			break;
		case 4:
			toneEmoji = '<span class="joypixels joypixels-diversity _270b-1f3fe">✋🏾</span>';
			break;
		case 5:
			toneEmoji = '<span class="joypixels joypixels-diversity _270b-1f3ff">✋🏿</span>';
			break;
		default:
			toneEmoji = '<span class="joypixels joypixels-people _270b">✋</span>';
	}

	return <Box dangerouslySetInnerHTML={{ __html: toneEmoji }} />;
};

export default ToneItem;
