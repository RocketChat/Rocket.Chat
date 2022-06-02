import { CheckBox } from '@rocket.chat/fuselage';
import * as MessageParser from '@rocket.chat/message-parser';
import React, { ReactElement } from 'react';

import InlineElements from '../elements/InlineElements';

type TaskListBlockProps = {
	tasks: MessageParser.Task[];
};

const TaksListBlock = ({ tasks }: TaskListBlockProps): ReactElement => (
	<ul className='task-list'>
		{tasks.map((item, index) => (
			<li key={index}>
				<CheckBox checked={item.status} /> <InlineElements children={item.value} />
			</li>
		))}
	</ul>
);

export default TaksListBlock;
