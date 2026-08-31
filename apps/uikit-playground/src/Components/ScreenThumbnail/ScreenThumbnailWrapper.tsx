import './Thumbnail.scss';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, ComponentProps } from 'react';

const ScreenThumbnailWrapper = ({
	children,
	onClick,
	width = '120px',
	height = '170px',
	padding = '20px',
	...props
}: {
	onClick?: ComponentProps<typeof Box>['onClick'];
	children: ReactNode;
} & ComponentProps<typeof Box>) => (
	<Box width={width} height={height} className='screen-thumbnail-wrapper'>
		<Box width={width} height={height} position='absolute' className='screenThumbnailBackdrop' onClick={onClick} />
		<Box
			width={`calc(${width} - ${padding})`}
			height={`calc(${height} - ${padding})`}
			position='relative'
			overflow='hidden'
			onClick={onClick}
			{...props}
		>
			{children}
		</Box>
	</Box>
);

export default ScreenThumbnailWrapper;
