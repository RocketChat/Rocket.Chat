import { OrderedList as ASTOrderedList } from '@rocket.chat/message-parser';
import React, { FC, Fragment } from 'react';

import Inline from '../Inline';

const ThreadPreviewOrderedList: FC<{ value: ASTOrderedList['value'] }> = ({ value }) => (
	<span>
		{value.map((item, index) => (
			<Fragment key={index}>
				{` ${index + 1}. `}
				<Inline value={item.value} />
			</Fragment>
		))}
	</span>
);

export default ThreadPreviewOrderedList;
