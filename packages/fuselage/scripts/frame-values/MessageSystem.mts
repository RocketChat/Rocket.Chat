import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { itemContentBase } from './lib/itemFrames.mts';
import { constant, leanText, truncating } from './lib/messageFrames.mts';
import type { Target } from './lib/target.mts';
import { fontColor, fontScale, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Message', file);

const generateMessageSystemContainer = () =>
	// The column centres on the avatar, and bleeds into the row's padding so a single line keeps the avatar's height
	constant('messageSystemContainerFrame', { ...itemContentBase, alignSelf: 'center', marginBlock: spacing('-x4')! });

const generateMessageSystemBody = () => constant('messageSystemBodyFrame', leanText({ render: 'div', display: 'block', ...truncating }));

const generateMessageSystemName = () =>
	constant(
		'messageSystemNameFrame',
		leanText({
			render: 'span',
			flexShrink: 0,
			color: fontColor('titles-labels'),
			...fontScale('p2b'),
		}),
	);

const generateThreadMessageContent = () =>
	constant(
		'threadMessageContentFrame',
		leanText({
			...itemContentBase,
			gap: spacing('x8')!,
			...truncating,
			color: fontColor('info'),
			...font('c1'),
		}),
	);

const generateThreadMessageContainer = () =>
	constant('threadMessageContainerFrame', leanText({ render: 'div', display: 'flex', flexDirection: 'row', width: '100%', ...truncating }));

const generateThreadMessageBody = () =>
	constant('threadMessageBodyFrame', leanText({ render: 'div', display: 'block', ...truncating, color: fontColor('default') }));

const generateThreadMessageOrigin = () =>
	[
		constant('threadMessageOriginFrame', leanText({ render: 'div', display: 'block', ...truncating })),
		constant('threadMessageOriginSystem', { true: { color: fontColor('default') } }),
	].join('\n\n');

const targets: Target[] = [
	{ file: component('MessageSystem/MessageSystemContainer.tsx'), generate: generateMessageSystemContainer },
	{ file: component('MessageSystem/MessageSystemBody.tsx'), generate: generateMessageSystemBody },
	{ file: component('MessageSystem/MessageSystemName.tsx'), generate: generateMessageSystemName },
	{ file: component('ThreadMessage/ThreadMessage.tsx'), generate: generateThreadMessageContent },
	{ file: component('ThreadMessage/ThreadMessageContainer.tsx'), generate: generateThreadMessageContainer },
	{ file: component('ThreadMessage/ThreadMessageBody.tsx'), generate: generateThreadMessageBody },
	{ file: component('ThreadMessage/ThreadMessageOrigin.tsx'), generate: generateThreadMessageOrigin },
];

export default targets;
