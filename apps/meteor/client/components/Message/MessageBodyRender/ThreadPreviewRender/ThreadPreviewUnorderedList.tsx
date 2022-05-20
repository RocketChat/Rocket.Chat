import { UnorderedList as ASTUnorderedList } from '@rocket.chat/message-parser';
import React, { FC, Fragment } from 'react';

import Inline from '../Inline';

const ThreadPreviewUnorderedList: FC<{ value: ASTUnorderedList['value'] }> = ({ value }) => (
	<span>
		{value.map((item, index) => (
			<Fragment key={index}>
				{' - '}
				<Inline value={item.value} />
			</Fragment>
		))}
	</span>
);

export default ThreadPreviewUnorderedList;
