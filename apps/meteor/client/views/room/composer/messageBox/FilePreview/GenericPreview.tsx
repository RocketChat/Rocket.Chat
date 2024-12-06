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
		right: '-10px',
		top: '-8px',
		backgroundColor: '#6d6c6c',
		display: isHovered ? 'block' : 'none',
		cursor: 'pointer',
		zIndex: 1,
		color: 'white',
		borderRadius: '100%',
	};
	return (
		<Box
			display='flex'
			style={{ width: '200px', borderColor: '#80808040', borderRadius: '10px', padding: '5px', marginBottom: '5px', borderWidth: '1px' }}
			alignItems='center'
			position='relative'
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			title={file.name}
		>
			{/* currently using div  */}
			<div style={{}}>
				{file.name.split('.')[1] === 'mp4' || file.name.split('.')[1] === 'webm' ? (
					<Icon style={{ color: '#ef0748' }} name='play' size='x24' mis={-2} mie={4} />
				) : (
					<Icon
						style={{ backgroundColor: '#ef0748', color: 'white', borderRadius: '10px', padding: '3px' }}
						name='adobe'
						size='x24'
						mis={-2}
						mie={4}
					/>
				)}
			</div>
			<Box style={{ display: 'flex', flexDirection: 'column' }}>
				<Box
					style={{
						marginLeft: '3px',
						width: '140px',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						fontWeight: '650',
					}}
				>{`${file.name.split('.')[0]} - ${formatBytes(file.size, 2)}`}</Box>
				<Box style={{ marginLeft: '10px', width: '140px', textTransform: 'uppercase' }}>{`${file.name.split('.')[1]}`}</Box>
			</Box>
			{/* <div> */}
			<Icon style={buttonStyle} name='cross' size='x16' mis={-2} mie={4} onClick={() => onRemove(index)} />
		</Box>
	);
};
export default GenericPreview;
