import { CheckBox } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../InlineElements';

export type TaskListBlockProps = {
	tasks: MessageParser.Task[];
};

const TaskListBlock = ({ tasks }: TaskListBlockProps) => {
	return (
		<ul className='task-list'>
			{tasks.map((item, index) => (
				<li key={index}>
					<CheckBox checked={item.status} readOnly /> <InlineElements>{item.value}</InlineElements>
				</li>
			))}
		</ul>
	);
};

export default TaskListBlock;
