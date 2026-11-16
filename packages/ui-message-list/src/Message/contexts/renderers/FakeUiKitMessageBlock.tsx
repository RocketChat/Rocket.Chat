import { Box } from '@rocket.chat/fuselage';

import type { MessageUiKitBlockProps } from '../MessageRenderersContext';

const FakeUiKitMessageBlock = ({ blocks }: MessageUiKitBlockProps) => (
	<Box fontScale='c1' color='hint' data-qa='uikit-placeholder'>
		{`UiKit: ${blocks.length} block${blocks.length === 1 ? '' : 's'}`}
	</Box>
);

export default FakeUiKitMessageBlock;
