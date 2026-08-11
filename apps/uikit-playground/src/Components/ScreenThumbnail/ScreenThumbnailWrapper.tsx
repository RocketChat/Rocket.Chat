import './Thumbnail.scss';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ScreenThumbnailWrapperProps = {
	onClick?: BoxProps['onClick'];
	children: ReactNode;
} & BoxProps;

const ScreenThumbnailWrapper = ({
	children,
	onClick,
	width = '120px',
	height = '170px',
	padding = '20px',
	...props
}: ScreenThumbnailWrapperProps) => (
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
