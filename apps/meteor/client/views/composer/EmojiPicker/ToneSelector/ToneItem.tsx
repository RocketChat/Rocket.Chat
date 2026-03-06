import { Box } from '@rocket.chat/fuselage';

const ToneItem = ({ tone }: { tone: number }) => {
	let toneEmoji;

	switch (tone) {
		case 1:
			toneEmoji = '✋🏻';
			break;
		case 2:
			toneEmoji = '✋🏼';
			break;
		case 3:
			toneEmoji = '✋🏽';
			break;
		case 4:
			toneEmoji = '✋🏾';
			break;
		case 5:
			toneEmoji = '✋🏿';
			break;
		default:
			toneEmoji = '✋';
	}

	return <Box className='emoji'>{toneEmoji}</Box>;
};

export default ToneItem;
