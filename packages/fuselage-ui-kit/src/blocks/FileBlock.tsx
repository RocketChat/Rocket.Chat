import { Box, Icon } from '@rocket.chat/fuselage';
import { useAbsoluteUrl } from '@rocket.chat/ui-contexts';
import type * as UiKit from '@rocket.chat/ui-kit';

import { useAppTranslation } from '../hooks/useAppTranslation';
import type { BlockProps } from '../utils/BlockProps';

export type FileBlockProps = BlockProps<UiKit.FileBlock>;

// A link to the file that reveals nothing about it; whether the viewer may read it is decided by the file URL.
const FileBlock = ({ block }: FileBlockProps) => {
	const { t } = useAppTranslation();
	const absoluteUrl = useAbsoluteUrl();

	if (!block.file_id || (block.source && block.source !== 'local')) {
		return null;
	}

	return (
		<Box
			is='a'
			href={absoluteUrl(`/file-upload/${encodeURIComponent(block.file_id)}/file`)}
			download
			display='flex'
			alignItems='center'
			gap='x8'
			padding='x12'
			maxWidth='345px'
			borderWidth='default'
			borderRadius='medium'
			borderColor='extra-light'
			backgroundColor='surface-tint'
			color='default'
		>
			<Icon name='attachment-file' size='x24' />
			<Box flexGrow={1} fontScale='p2b'>
				{t('File')}
			</Box>
			<Icon name='download' size='x20' />
		</Box>
	);
};

export default FileBlock;
