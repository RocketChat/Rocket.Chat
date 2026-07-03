import { Box, IconButton } from '@rocket.chat/fuselage';
import { FilePreviewIcon } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { getFileExtension } from '../../../../../../../../lib/utils/getFileExtension';
import { formatBytes } from '../../../../../../../lib/utils/formatBytes';

const LicenseFilePreview = ({ selectedFile, handleRemoveFile }: { selectedFile: File; handleRemoveFile: () => void }) => {
	const { t } = useTranslation();

	return (
		<Box display='flex' alignItems='center' padding={4} mbe={8} borderRadius={4} borderWidth={1} borderColor='extra-light'>
			<FilePreviewIcon format={getFileExtension(selectedFile.name)} />
			<Box flexGrow={1} withTruncatedText mis={8} display='flex' flexDirection='column'>
				<Box fontScale='p2' color='info' withTruncatedText>
					{selectedFile.name}
				</Box>
				<Box fontScale='c1' color='hint' textTransform='uppercase'>
					{`${formatBytes(selectedFile.size, 2)} - ${getFileExtension(selectedFile.name)}`}
				</Box>
			</Box>
			<IconButton icon='cross' tiny title={t('Remove_file')} onClick={handleRemoveFile} />
		</Box>
	);
};

export default LicenseFilePreview;
