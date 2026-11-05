import { CheckBox } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { useContext } from 'react';

import NestedListsBlock from './NestedListsBlock.js';
import { MarkupInteractionContext } from '../MarkupInteractionContext.js';
import InlineElements from '../elements/InlineElements.js';

export type TaskListBlockProps = {
	tasks: MessageParser.Task[];
};

const TaskListBlock = ({ tasks }: TaskListBlockProps) => {
	const { onTaskChecked } = useContext(MarkupInteractionContext);

	return (
		<ul className='task-list'>
			{tasks.map((item, index) => (
				<li key={index}>
					<CheckBox checked={item.status} onChange={onTaskChecked?.(item)} /> <InlineElements>{item.value}</InlineElements>
					{item.nested && <NestedListsBlock lists={item.nested} />}
				</li>
			))}
		</ul>
	);
};

export default TaskListBlock;
