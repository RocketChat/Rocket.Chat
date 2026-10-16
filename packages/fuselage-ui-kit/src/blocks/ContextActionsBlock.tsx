import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useMemo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

export type ContextActionsBlockProps = BlockProps<UiKit.ContextActionsBlock>;

const ContextActionsBlock = ({ className, block, surfaceRenderer }: ContextActionsBlockProps) => {
	const elements = useMemo(
		() =>
			block.elements.map((element) => ({
				...element,
				appId: element.appId ?? block.appId,
				blockId: element.blockId ?? block.blockId,
			})),
		[block.appId, block.blockId, block.elements],
	);

	return (
		<Box className={className} display='flex' alignItems='center' flexWrap='wrap' margin={-2}>
			{elements.map((element, index) => (
				<Box key={index} display='flex' margin={2}>
					{surfaceRenderer.renderActionsBlockElement(element, index)}
				</Box>
			))}
		</Box>
	);
};

export default memo(ContextActionsBlock);
