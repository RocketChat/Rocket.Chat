import { Box } from '@rocket.chat/fuselage';

const TONE_EMOJIS: Record<number, string> = {
	1: '✋🏻',
	2: '✋🏼',
	3: '✋🏽',
	4: '✋🏾',
	5: '✋🏿',
};

const ToneItem = ({ tone }: { tone: number }) => (
	<Box>
		<span className='emoji'>{TONE_EMOJIS[tone] ?? '✋'}</span>
	</Box>
);

export default ToneItem;
