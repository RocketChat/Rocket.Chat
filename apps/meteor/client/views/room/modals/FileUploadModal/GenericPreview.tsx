import { Box, Icon } from '@rocket.chat/fuselage';

import { formatBytes } from '../../../../lib/utils/formatBytes';

export type GenericPreviewProps = { file: File };

const GenericPreview = ({ file }: GenericPreviewProps) => (
	<Box display='flex' alignItems='center' w='full' fontScale='h4'>
		<Icon name='file' size='x24' mis={-2} mie={4} />
		{`${file.name} - ${formatBytes(file.size, 2)}`}
	</Box>
);

export default GenericPreview;
