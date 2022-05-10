import { Box, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { formatBytes } from '../../../../lib/utils/formatBytes';

const GenericPreview = ({ file }: { file: File }): ReactElement => (
	<Box display='flex' alignItems='center' w='full' fontScale='h4'>
		<Icon name='file' size='x24' mis={-2} mie={4} />
		{`${file.name} - ${formatBytes(file.size, 2)}`}
	</Box>
);

export default GenericPreview;
