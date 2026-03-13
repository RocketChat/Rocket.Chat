import { Box } from '@rocket.chat/fuselage';

const ToneItem = ({ tone }: { tone: number }) => {
	let toneEmoji;

	switch (tone) {
		case 1:
			toneEmoji = '<span class="emoji">✋🏻</span>';
			break;
		case 2:
			toneEmoji = '<span class="emoji">✋🏼</span>';
			break;
		case 3:
			toneEmoji = '<span class="emoji">✋🏽</span>';
			break;
		case 4:
			toneEmoji = '<span class="emoji">✋🏾</span>';
			break;
		case 5:
			toneEmoji = '<span class="emoji">✋🏿</span>';
			break;
		default:
			toneEmoji = '<span class="emoji">✋</span>';
	}

	return <Box dangerouslySetInnerHTML={{ __html: toneEmoji }} />;
};

export default ToneItem;
