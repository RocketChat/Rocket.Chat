import { CheckBox } from '@rocket.chat/fuselage';
import { Tasks as ASTTasks } from '@rocket.chat/message-parser';
import React, { FC } from 'react';

import Inline from './Inline';

const TaksList: FC<{ value: ASTTasks['value'] }> = ({ value }) => (
	<ul
		style={{
			listStyle: 'none',
			marginLeft: 0,
			paddingLeft: 0,
		}}
	>
		{value.map((item) => (
			<li>
				<CheckBox checked={item.status} /> <Inline value={item.value} />
			</li>
		))}
	</ul>
);

export default TaksList;
