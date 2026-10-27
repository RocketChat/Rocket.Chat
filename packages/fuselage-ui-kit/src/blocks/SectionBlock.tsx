import { Box, Grid, GridItem } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useMemo } from 'react';

import Fields from './SectionBlock.Fields';
import type { BlockProps } from '../utils/BlockProps';

export type SectionBlockProps = BlockProps<UiKit.SectionBlock>;

const SectionBlock = ({ className, block, surfaceRenderer }: SectionBlockProps) => {
	const { text, fields } = block;

	const accessoryElement = useMemo(
		() =>
			block.accessory
				? {
						appId: block.appId,
						blockId: block.blockId,
						...block.accessory,
					}
				: undefined,
		[block.appId, block.blockId, block.accessory],
	);

	// Option lists need the full width; squeezed into the side column their labels wrap letter by letter.
	if (block.accessory?.type === 'checkbox' || block.accessory?.type === 'radio_button') {
		return (
			<Box className={className}>
				{text && (
					<Box is='span' fontScale='p2' color='default'>
						{surfaceRenderer.renderTextObject(text, 0)}
					</Box>
				)}
				{fields && <Fields fields={fields} surfaceRenderer={surfaceRenderer} />}
				<Box marginBlockStart={text || fields ? 4 : undefined}>
					{accessoryElement ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0) : null}
				</Box>
			</Box>
		);
	}

	return (
		<Grid className={className}>
			<GridItem>
				{text && (
					<Box is='span' fontScale='p2' color='default'>
						{surfaceRenderer.renderTextObject(text, 0)}
					</Box>
				)}
				{fields && <Fields fields={fields} surfaceRenderer={surfaceRenderer} />}
			</GridItem>
			{block.accessory && (
				<Box flexGrow={0} flexBasis='0'>
					<GridItem>{accessoryElement ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0) : null}</GridItem>
				</Box>
			)}
		</Grid>
	);
};

export default memo(SectionBlock);
