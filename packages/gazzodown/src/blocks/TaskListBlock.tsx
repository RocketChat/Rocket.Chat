import { CheckBox } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';
import { useContext } from 'react';

import { MarkupInteractionContext } from '../MarkupInteractionContext';
import InlineElements from '../elements/InlineElements';

type TaskListBlockProps = {
	tasks: MessageParser.Task[];
};

const TaksListBlock = ({ tasks }: TaskListBlockProps): ReactElement => {
	const { onTaskChecked } = useContext(MarkupInteractionContext);

	return (
		<ul className='task-list'>
			{tasks.map((item, index) => (
				<li key={index} style={item.indentLevel ? { marginInlineStart: `${item.indentLevel * 0.5}rem` } : undefined}>
					<CheckBox checked={item.status} onChange={onTaskChecked?.(item)} /> <InlineElements>{item.value}</InlineElements>
				</li>
			))}
		</ul>
	);
};

export default TaksListBlock;
