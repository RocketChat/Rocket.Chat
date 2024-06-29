import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { formatBytes } from '../../../../lib/utils/formatBytes';

type GenericPreviewProps = {
	file: File;
	index: number; // Add index as a prop
	onRemove: (index: number) => void; // Function to handle file removal with index
};

const GenericPreview = ({ file, index, onRemove }: GenericPreviewProps): ReactElement => (
	<Box style={{ justifyContent: 'space-between', marginTop: '10px' }} display='flex' alignItems='center' w='full' fontScale='h4'>
		<Box>
			<Icon name='file' size='x24' mis={-2} mie={4} />
			{`${file.name} - ${formatBytes(file.size, 2)}`}
		</Box>
		<Box color='red' style={{ cursor: 'pointer' }}>
			<Icon name='trash' size='x24' mis={-2} mie={4} onClick={() => onRemove(index)} /> {/* Pass index to onRemove */}
		</Box>
	</Box>
);

export default GenericPreview;
