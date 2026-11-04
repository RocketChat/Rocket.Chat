import { Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import { TaskCard } from './TaskCard';
import type { BlockProps } from '../utils/BlockProps';

export type PlanBlockProps = BlockProps<UiKit.PlanBlock>;

const PlanBlock = ({ className, block, context, surfaceRenderer }: PlanBlockProps) => (
	<Box
		className={className}
		display='flex'
		flexDirection='column'
		borderWidth='default'
		borderRadius='medium'
		borderColor='extra-light'
		backgroundColor='surface-tint'
	>
		<Box fontScale='h5' color='default' padding='x12'>
			{block.title}
		</Box>
		{block.tasks.map((task, index) => (
			<TaskCard key={task.task_id} task={task} context={context} index={index} surfaceRenderer={surfaceRenderer} />
		))}
	</Box>
);

export default memo(PlanBlock);
