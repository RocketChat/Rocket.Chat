import { Box, Divider } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { Fragment, memo, useMemo } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import { renderNestedBlocks } from '../utils/renderNestedBlocks';

export type LayoutGridBlockProps = BlockProps<UiKit.LayoutGridBlock>;

const weights = { narrow: 1, standard: 2, wide: 3 } as const;
const minWidths = { narrow: 120, standard: 200, wide: 280 } as const;
const alignments = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

const isRow = (value: unknown): value is UiKit.LayoutRow => isObject(value) && 'items' in value && Array.isArray(value.items);

const LayoutGridBlock = ({ className, block, surfaceRenderer }: LayoutGridBlockProps) => {
	const rows = useMemo(
		() =>
			(Array.isArray(block.rows) ? block.rows : []).filter(isRow).map((row) =>
				row.items.filter(isObject).map((item) => ({
					item,
					content: renderNestedBlocks(surfaceRenderer, [item.block], UiKit.layoutItemBlockTypes, block),
				})),
			),
		[surfaceRenderer, block],
	);
	const bordered = block.grid_lines === 'rows' || block.grid_lines === 'outer';

	return (
		<Box className={className} display='flex' flexDirection='column' gap='x8'>
			{block.is_label_visible && (
				<Box fontScale='p2b' color='default'>
					{block.label}
				</Box>
			)}
			<Box
				display='flex'
				flexDirection='column'
				gap={block.grid_lines === 'rows' ? 'x12' : 'x16'}
				borderWidth={bordered ? 'default' : undefined}
				borderColor={bordered ? 'extra-light' : undefined}
				borderRadius={bordered ? 'medium' : undefined}
				padding={bordered ? 'x12' : undefined}
			>
				{rows.map((row, rowIndex) => (
					<Fragment key={rowIndex}>
						{block.grid_lines === 'rows' && rowIndex > 0 && <Divider flush />}
						<Box display='flex' flexWrap='wrap' gap='x16'>
							{row.map(({ item, content }, itemIndex) => {
								const width = item.width ?? 'standard';

								return (
									<Box
										key={itemIndex}
										display='flex'
										flexDirection='column'
										flexGrow={weights[width] ?? weights.standard}
										flexShrink={1}
										flexBasis={0}
										minWidth={minWidths[width] ?? minWidths.standard}
										alignItems={item.horizontal_alignment ? alignments[item.horizontal_alignment] : undefined}
									>
										{content}
									</Box>
								);
							})}
						</Box>
					</Fragment>
				))}
			</Box>
		</Box>
	);
};

export default memo(LayoutGridBlock);
