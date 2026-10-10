import { CheckBox } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { useContext } from 'react';

import Markup from '../Markup';
import { MarkupInteractionContext } from '../MarkupInteractionContext';
import InlineElements from '../elements/InlineElements';

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
					{item.nested && <Markup tokens={item.nested} />}
				</li>
			))}
		</ul>
	);
};

export default TaskListBlock;
