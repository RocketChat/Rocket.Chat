import type { ReactElement } from 'react';
import React from 'react';

import VerticalBar from '../../../../../components/VerticalBar';

const ThreadSkeleton = (): ReactElement => {
	return (
		<VerticalBar.Skeleton
			className='rcx-thread-view'
			position='absolute'
			display='flex'
			flexDirection='column'
			width='full'
			maxWidth={855}
			overflow='hidden'
			zIndex={100}
			insetBlock={0}
			insetInlineEnd={0}
			borderStartStartRadius={4}
		/>
	);
};

export default ThreadSkeleton;
