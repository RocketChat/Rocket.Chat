import { Tasks as ASTTasks } from '@rocket.chat/message-parser';
import React, { FC, Fragment } from 'react';

import Inline from '../Inline';

const ThreadPreviewTaskList: FC<{ value: ASTTasks['value'] }> = ({ value }) => (
	<span>
		{value.map((item, index) => (
			<Fragment key={index}>
				{` - [${item.status ? 'x' : ' '}]`} <Inline value={item.value} />
			</Fragment>
		))}
	</span>
);

export default ThreadPreviewTaskList;
