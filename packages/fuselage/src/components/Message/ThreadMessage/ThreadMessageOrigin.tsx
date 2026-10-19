import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, textScale, truncatedText } from '../messageStyles';

const ThreadMessageOriginFrame = styled(Text, {
	render: 'div',
	display: 'block',
	...boxText,
	...textScale('c1'),
	...truncatedText,
	flexShrink: 1,
	cursor: 'pointer',
	color: String(textIconColors['font-info']),

	variants: {
		system: {
			true: {
				color: String(textIconColors['font-default']),
			},
		},
	} as const,
});

export type ThreadMessageOriginProps = {
	children?: ReactNode;
	system?: boolean;
};

const ThreadMessageOrigin = ({ children, system }: ThreadMessageOriginProps) => (
	<ThreadMessageOriginFrame
		system={system}
		className={['rcx-message-thread__origin', system && 'rcx-message-thread__origin--system'].filter(Boolean).join(' ')}
	>
		{children}
	</ThreadMessageOriginFrame>
);

export default withFuselageProvider(ThreadMessageOrigin);
