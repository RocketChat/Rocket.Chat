import { Box } from '@rocket.chat/fuselage';
import DOMPurify from 'dompurify';

export type ToneItemProps = { tone: number };

const ToneItem = ({ tone }: ToneItemProps) => {
	let toneEmoji;

	switch (tone) {
		case 1:
			toneEmoji = '<span class="emojione emojione-diversity _270b-1f3fb">✋🏻</span>';
			break;
		case 2:
			toneEmoji = '<span class="emojione emojione-diversity _270b-1f3fc">✋🏼</span>';
			break;
		case 3:
			toneEmoji = '<span class="emojione emojione-diversity _270b-1f3fd">✋🏽</span>';
			break;
		case 4:
			toneEmoji = '<span class="emojione emojione-diversity _270b-1f3fe">✋🏾</span>';
			break;
		case 5:
			toneEmoji = '<span class="emojione emojione-diversity _270b-1f3ff">✋🏿</span>';
			break;
		default:
			toneEmoji = '<span class="emojione emojione-people _270b">✋</span>';
	}

	return <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(toneEmoji) }} />;
};

export default ToneItem;
