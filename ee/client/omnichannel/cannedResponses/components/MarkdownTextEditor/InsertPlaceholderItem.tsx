import { Box } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

type InsertPlaceholderItemType = {
	text: string;
};

const InsertPlaceholderItem: FC<InsertPlaceholderItemType> = ({ text }) => (
	<Box is='li' onClick={(): void => console.log('test')}>
		<Box mb='4px' className='rc-popover__label' style={{ width: '100%' }} fontScale='p1'>
			{text}
		</Box>
	</Box>
);

export default memo(InsertPlaceholderItem);
