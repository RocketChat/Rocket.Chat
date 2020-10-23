import React, { FC, useMemo } from 'react';
import { Modal, Box } from '@rocket.chat/fuselage';

import VerticalBar from '../../../../client/components/basic/VerticalBar';

type ThreadSkeletonProps = {
	expanded: boolean;
	onClose: () => void;
};

const ThreadSkeleton: FC<ThreadSkeletonProps> = ({ expanded, onClose }) => {
	const style = useMemo(() => (document.dir === 'rtl'
		? {
			left: 0,
			borderTopRightRadius: 4,
		}
		: {
			right: 0,
			borderTopLeftRadius: 4,
		}), []);

	return <>
		{expanded && <Modal.Backdrop onClick={onClose} />}
		<Box width='380px' flexGrow={1} position={expanded ? 'static' : 'relative'}>
			<VerticalBar.Skeleton
				className='rcx-thread-view'
				position='absolute'
				display='flex'
				flexDirection='column'
				width={expanded ? 'full' : 380}
				maxWidth={855}
				overflow='hidden'
				zIndex={100}
				insetBlock={0}
				// insetInlineEnd={0}
				// borderStartStartRadius={4}
				style={style} // workaround due to a RTL bug in Fuselage
			/>
		</Box>
	</>;
};

export default ThreadSkeleton;
