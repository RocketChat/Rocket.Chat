import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Palette } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { AllHTMLAttributes, ReactElement } from 'react';

import MessageComposerFileLoader from './MessageComposerFileLoader';
import { getMimeType } from '../../../../../app/utils/lib/mimeTypes';
import type { Upload } from '../../../../lib/chats/Upload';
import { formatBytes } from '../../../../lib/utils/formatBytes';
import FileUploadModal from '../../modals/FileUploadModal';

type MessageComposerFileProps = {
	upload: Upload;
	onRemove: (id: string) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const MessageComposerFile = ({ upload, onRemove, onEdit, ...props }: MessageComposerFileProps): ReactElement => {
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

	const fileSize = formatBytes(upload.file.size, 2);
	const fileExtension = getMimeType(upload.file.type, upload.file.name);
	const isLoading = upload.percentage > 0 && upload.percentage !== 100;

	const handleOpenFilePreview = () => {
		setModal(
			<FileUploadModal
				onSubmit={(name) => {
					onEdit(upload.id, name);
					setModal(null);
				}}
				fileName={upload.file.name}
				file={upload.file}
				onClose={() => setModal(null)}
			/>,
		);
	};

	return (
		<Box
			tabIndex={0}
			role='button'
			rcx-input-box__wrapper
			className={previewWrapperStyle}
			display='flex'
			padding={4}
			borderRadius={4}
			borderWidth={1}
			borderColor='extra-light'
			alignItems='center'
			position='relative'
			title={upload.file.name}
			height='x56'
			width='x200'
			mie={8}
			onClick={handleOpenFilePreview}
			onKeyDown={(e) => ['Enter', 'Space'].includes(e.code) && handleOpenFilePreview()}
			{...props}
		>
			<Box width='140px' mis={4} display='flex' flexDirection='column'>
				<Box fontScale='p2' color='info' withTruncatedText>
					{upload.file.name}
				</Box>
				<Box fontScale='c1' color='hint' textTransform='uppercase'>{`${fileSize} - ${fileExtension}`}</Box>
			</Box>
			<Box
				className={closeWrapperStyle}
				onClick={(e) => {
					e.stopPropagation();
					onRemove(upload.id);
				}}
			>
				{isLoading && <MessageComposerFileLoader />}
				{!isLoading && <IconButton mini icon='cross' />}
			</Box>
		</Box>
	);
};

export default MessageComposerFile;
