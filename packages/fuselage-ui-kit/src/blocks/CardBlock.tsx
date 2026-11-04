import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import CardView from './CardView';
import type { BlockProps } from '../utils/BlockProps';

export type CardBlockProps = BlockProps<UiKit.CardBlock>;

const maxWidth = 360;

const CardBlock = ({ className, block, surfaceRenderer }: CardBlockProps) => (
	<Box className={className} display='flex' maxWidth={maxWidth}>
		<CardView block={block} surfaceRenderer={surfaceRenderer} />
	</Box>
);

export default memo(CardBlock);
