import { Box } from '@rocket.chat/fuselage';

import MessageComposerFile from './MessageComposerFile';

type MessageComposerFileAreaProps = {
	filesToUpload: File[];
	handleRemoveFile: (indexToRemove: number) => void;
};

const MessageComposerFileArea = ({ filesToUpload, handleRemoveFile }: MessageComposerFileAreaProps) => {
	return (
		<Box display='flex' width='100%' flexDirection='row' pi={8} pbe={8} pbs={2} overflowX='auto' style={{ whiteSpace: 'nowrap' }}>
			{filesToUpload.map((file, index) => (
				<div key={index} id={`file-preview-${index}`}>
					<MessageComposerFile key={index} file={file} index={index} onRemove={handleRemoveFile} />
				</div>
			))}
		</Box>
	);
};

export default MessageComposerFileArea;
