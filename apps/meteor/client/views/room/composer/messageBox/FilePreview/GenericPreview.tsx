import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useState } from 'react';

import { formatBytes } from '../../../../../lib/utils/formatBytes';

type GenericPreviewProps = {
	file: File;
	index: number;
	onRemove: (index: number) => void;
};

const GenericPreview = ({ file, index, onRemove }: GenericPreviewProps): ReactElement => {
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const buttonStyle: React.CSSProperties = {
		position: 'absolute' as const,
		right: 0,
		top: 0,
		backgroundColor: 'gray',
		display: isHovered ? 'block' : 'none',
		cursor: 'pointer',
		zIndex: 1,
		color: 'white',
		borderRadius: '100%',
	};
	return (
		<Box
			display='flex'
			style={{ width: '200px', backgroundColor: '#D3D3D3', borderRadius: '10px', padding: '5px' }}
			alignItems='center'
			position='relative'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<Box style={{ backgroundColor: 'red', borderRadius: '10px', padding: '3px' }}>
				{file.name.split('.')[1] === 'mp4' || file.name.split('.')[1] === 'webm' ? (
					<Icon name='play' size='x24' mis={-2} mie={4} />
				) : (
					<Icon style={{ color: 'white' }} name='adobe' size='x24' mis={-2} mie={4} />
				)}
			</Box>
			<Box style={{ display: 'flex', flexDirection: 'column' }}>
				<Box
					style={{
						marginLeft: '10px',
						width: '140px',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>{`${file.name.split('.')[0]} - ${formatBytes(file.size, 2)}`}</Box>
				<Box style={{ marginLeft: '10px', width: '140px' }}>{`${file.name.split('.')[1]}`}</Box>
			</Box>
			{/* <div> */}
			<Icon style={buttonStyle} name='cross' size='x20' mis={-2} mie={4} onClick={() => onRemove(index)} />
		</Box>
	);
};
export default GenericPreview;
