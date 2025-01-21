import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Palette } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { fileUploadIsValidContentType } from '../../../../../app/utils/client';
import { formatBytes } from '../../../../lib/utils/formatBytes';
// import { isIE11 } from '../../../../../lib/utils/isIE11';
import FileUploadModal from '../../modals/FileUploadModal';

// export enum FilePreviewType {
// 	IMAGE = 'image',
// 	AUDIO = 'audio',
// 	VIDEO = 'video',
// }

// const getFileType = (fileType: File['type']): FilePreviewType | undefined => {
// 	if (!fileType) {
// 		return;
// 	}
// 	for (const type of Object.values(FilePreviewType)) {
// 		if (fileType.indexOf(type) > -1) {
// 			return type;
// 		}
// 	}
// };

// const shouldShowMediaPreview = (file: File, fileType: FilePreviewType | undefined): boolean => {
// 	if (!fileType) {
// 		return false;
// 	}
// 	if (isIE11) {
// 		return false;
// 	}
// 	// Avoid preview if file size bigger than 10mb
// 	if (file.size > 10000000) {
// 		return false;
// 	}
// 	if (!Object.values(FilePreviewType).includes(fileType)) {
// 		return false;
// 	}
// 	return true;
// };

type MessageComposerFileProps = {
	file: File;
	key: number;
	index: number;
	onRemove: (index: number) => void;
};

const MessageComposerFile = ({ file, index, onRemove }: MessageComposerFileProps): ReactElement => {
	// if (shouldShowMediaPreview(file, fileType)) {
	// 	return <MediaPreview file={file} fileType={fileType} onRemove={handleRemove} index={index} />;
	// }

	const [fileName, setFileName] = useState(file.name.split('.')[0]);
	const setModal = useSetModal();

	const previewWrapperStyle = css`
		background-color: 'surface-tint';

		&:hover {
			cursor: pointer;
			background-color: ${Palette.surface['surface-hover']};
		}
	`;

	const closeWrapperStyle = css`
		position: absolute;
		right: 0.25rem;
		top: 0.25rem;
	`;

	const fileExtension = file.name.split('.')[1];
	const fileSize = formatBytes(file.size, 2);

	return (
		<Box
			tabIndex={0}
			rcx-input-box__wrapper
			className={previewWrapperStyle}
			display='flex'
			padding={4}
			borderRadius={4}
			borderWidth={1}
			borderColor='extra-light'
			alignItems='center'
			position='relative'
			title={file.name}
			height='x56'
			width='x200'
			mie={8}
			onClick={() =>
				setModal(
					<FileUploadModal
						onSubmit={(name) => setFileName(name)}
						fileName={fileName}
						file={file}
						onClose={() => setModal(null)}
						invalidContentType={!fileUploadIsValidContentType(file?.type)}
					/>,
				)
			}
		>
			<Box width='140px' mis={4} display='flex' flexDirection='column'>
				<Box fontScale='p2' color='info' withTruncatedText>
					{fileName}
				</Box>
				<Box fontScale='c1' color='hint' textTransform='uppercase'>{`${fileSize} - ${fileExtension}`}</Box>
			</Box>
			<Box
				className={closeWrapperStyle}
				// data-mid={reply._id}
				// onClick={(): void => {
				// 	chat.composer?.dismissQuotedMessage(reply._id);
				// }}
				onClick={(e) => {
					e.stopPropagation();
					onRemove(index);
				}}
			>
				<IconButton mini icon='cross' />
			</Box>
			{/* <Icon style={buttonStyle} name='cross' size='x16' mis={-2} mie={4} onClick={() => onRemove(index)} /> */}
		</Box>
	);

	// return <GenericPreview file={file} onRemove={handleRemove} index={index} />;
};

export default MessageComposerFile;
