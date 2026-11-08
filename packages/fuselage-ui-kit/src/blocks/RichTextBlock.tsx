import { Box, Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import type * as UiKit from '@rocket.chat/ui-kit';
import { Suspense, memo, useMemo } from 'react';

import RichTextLine from './RichTextLine';
import { useRichTextMentionNames } from '../hooks/useRichTextMentionNames';
import type { BlockProps } from '../utils/BlockProps';
import { richTextToRuns } from '../utils/richText/richTextRuns';

export type RichTextBlockProps = BlockProps<UiKit.RichTextBlock>;

const RichTextBlock = ({ className, block }: RichTextBlockProps) => {
	const names = useRichTextMentionNames(block);
	const runs = useMemo(() => richTextToRuns(block, names), [block, names]);

	return (
		<Box className={className} fontScale='p2' color='default'>
			<Suspense fallback={<Skeleton />}>
				{runs.map((run, index) => {
					if (run.kind === 'markup') return <Markup key={index} tokens={run.tokens} />;

					if (run.container === 'section') return <RichTextLine key={index} parts={run.lines[0]} />;

					if (run.container === 'quote') {
						return (
							<Box key={index} is='blockquote' paddingInlineStart='x12' borderInlineStartWidth='default' borderColor='extra-light'>
								<RichTextLine parts={run.lines[0]} />
							</Box>
						);
					}

					return (
						<Box key={index} is={run.container === 'ordered' ? 'ol' : 'ul'} paddingInlineStart='x24'>
							{run.lines.map((parts, lineIndex) => (
								<li key={lineIndex}>
									<RichTextLine parts={parts} />
								</li>
							))}
						</Box>
					);
				})}
			</Suspense>
		</Box>
	);
};

export default memo(RichTextBlock);
