import GenericPreview from './GenericPreview';
import MediaPreview from './MediaPreview';
import { MAX_FILE_SIZE_PREVIEW } from '../../../../lib/constants';
import { isIE11 } from '../../../../lib/utils/isIE11';

export enum FilePreviewType {
	IMAGE = 'image',
	AUDIO = 'audio',
	VIDEO = 'video',
}

const getFileType = (fileType: File['type']): FilePreviewType | undefined => {
	if (!fileType) {
		return;
	}
	for (const type of Object.values(FilePreviewType)) {
		if (fileType.indexOf(type) > -1) {
			return type;
		}
	}
};

const shouldShowMediaPreview = (file: File, fileType: FilePreviewType | undefined): boolean => {
	if (!fileType) {
		return false;
	}
	if (isIE11) {
		return false;
	}
	// Avoid preview if file size bigger than 10mb
	if (file.size > MAX_FILE_SIZE_PREVIEW) {
		return false;
	}
	if (!Object.values(FilePreviewType).includes(fileType)) {
		return false;
	}
	return true;
};

type FilePreviewProps = {
	file: File;
	description?: string;
};

const FilePreview = ({ file, description }: FilePreviewProps) => {
	const fileType = getFileType(file.type);

	if (shouldShowMediaPreview(file, fileType)) {
		return <MediaPreview file={file} fileType={fileType as FilePreviewType} description={description} />;
	}

	return <GenericPreview file={file} />;
};

export default FilePreview;
