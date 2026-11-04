import { Box, Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import type * as UiKit from '@rocket.chat/ui-kit';
import { Suspense, memo, useMemo } from 'react';

import { useRichTextMentionNames } from '../hooks/useRichTextMentionNames';
import type { BlockProps } from '../utils/BlockProps';
import { richTextToAst } from '../utils/richText/richTextToAst';

export type RichTextBlockProps = BlockProps<UiKit.RichTextBlock>;

const RichTextBlock = ({ className, block }: RichTextBlockProps) => {
	const names = useRichTextMentionNames(block);
	const tokens = useMemo(() => richTextToAst(block, names), [block, names]);

	return (
		<Box className={className} fontScale='p2' color='default'>
			<Suspense fallback={<Skeleton />}>
				<Markup tokens={tokens} />
			</Suspense>
		</Box>
	);
};

export default memo(RichTextBlock);
