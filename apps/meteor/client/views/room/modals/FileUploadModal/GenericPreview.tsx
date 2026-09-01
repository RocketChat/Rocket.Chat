import { Box, Icon } from '@rocket.chat/fuselage';

import { formatBytes } from '../../../../lib/utils/formatBytes';

export type GenericPreviewProps = { file: File };

const GenericPreview = ({ file }: GenericPreviewProps) => (
	<Box display='flex' alignItems='center' width='full' fontScale='h4'>
		<Icon name='file' size='x24' marginInlineStart={-2} marginInlineEnd={4} />
		{`${file.name} - ${formatBytes(file.size, 2)}`}
	</Box>
);

export default GenericPreview;
