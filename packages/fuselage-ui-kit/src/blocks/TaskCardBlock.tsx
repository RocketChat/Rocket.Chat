import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import { TaskCard } from './TaskCard';
import type { BlockProps } from '../utils/BlockProps';

export type TaskCardBlockProps = BlockProps<UiKit.TaskCardBlock>;

const TaskCardBlock = ({ className, block, context, index, surfaceRenderer }: TaskCardBlockProps) => (
	<Box className={className} borderWidth='default' borderRadius='medium' borderColor='extra-light' backgroundColor='surface-tint'>
		<TaskCard task={block} context={context} index={index} surfaceRenderer={surfaceRenderer} />
	</Box>
);

export default memo(TaskCardBlock);
