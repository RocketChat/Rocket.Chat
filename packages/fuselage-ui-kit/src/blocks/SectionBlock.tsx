import { Box, Flex, Grid, GridItem } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

import Fields from './SectionBlock.Fields';
import type { BlockProps } from '../utils/BlockProps';

type SectionBlockProps = BlockProps<UiKit.SectionBlock>;

const SectionBlock = ({ className, block, surfaceRenderer }: SectionBlockProps): ReactElement => {
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

	return (
		<Grid className={className}>
			<GridItem>
				{text && (
					<Box is='span' fontScale='p2' color='default'>
						{surfaceRenderer.text(text)}
					</Box>
				)}
				{fields && <Fields fields={fields} surfaceRenderer={surfaceRenderer} />}
			</GridItem>
			{block.accessory && (
				<Flex.Item grow={0}>
					<GridItem>{accessoryElement ? surfaceRenderer.renderSectionAccessoryBlockElement(accessoryElement, 0) : null}</GridItem>
				</Flex.Item>
			)}
		</Grid>
	);
};

export default memo(SectionBlock);
