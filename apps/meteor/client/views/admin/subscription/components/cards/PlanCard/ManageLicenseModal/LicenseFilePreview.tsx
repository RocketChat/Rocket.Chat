import { IconButton, Text } from '@rocket.chat/fuselage';
import { FilePreviewIcon } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { getFileExtension } from '../../../../../../../../lib/utils/getFileExtension';
import { formatBytes } from '../../../../../../../lib/utils/formatBytes';
import LicenseFileFrame from '../../../../layout/LicenseFileFrame';

const LicenseFilePreview = ({ selectedFile, handleRemoveFile }: { selectedFile: File; handleRemoveFile: () => void }) => {
	const { t } = useTranslation();

	return (
		<LicenseFileFrame
			icon={<FilePreviewIcon format={getFileExtension(selectedFile.name)} />}
			name={
				<Text fontScale='p2' color='info' truncate>
					{selectedFile.name}
				</Text>
			}
			details={
				<Text fontScale='c1' color='hint'>
					{`${formatBytes(selectedFile.size, 2)} - ${getFileExtension(selectedFile.name)}`}
				</Text>
			}
			action={<IconButton icon='cross' size='tiny' title={t('Remove_file')} onClick={handleRemoveFile} />}
		/>
	);
};

export default LicenseFilePreview;
