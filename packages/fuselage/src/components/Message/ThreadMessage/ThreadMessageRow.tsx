import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { size } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxText, truncatedText } from '../messageStyles';

const ThreadMessageRowFrame = styled(View, {
	render: 'div',
	...boxText,
	...truncatedText,
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	width: size('full'),
	cursor: 'pointer',
});

export type ThreadMessageRowProps = HTMLAttributes<HTMLDivElement>;

const ThreadMessageRow = (props: ThreadMessageRowProps) => (
	<ThreadMessageRowFrame className='rcx-message-thread__row' {...(props as GetProps<typeof ThreadMessageRowFrame>)} />
);

export default withFuselageProvider(ThreadMessageRow);
