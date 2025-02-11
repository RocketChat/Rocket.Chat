import { Box } from '@rocket.chat/fuselage';

import MessageComposerFile from './MessageComposerFile';
import type { Upload } from '../../../../lib/chats/Upload';

type MessageComposerFileAreaProps = {
	uploads?: readonly Upload[];
	handleRemoveUpload: (id: Upload['id']) => void;
	handleEditFileName: (id: Upload['id'], fileName: string) => void;
};

const MessageComposerFileArea = ({ uploads, handleRemoveUpload, handleEditFileName }: MessageComposerFileAreaProps) => {
	return (
		<Box display='flex' width='100%' flexDirection='row' pi={8} pbe={8} pbs={2} overflowX='auto' style={{ whiteSpace: 'nowrap' }}>
			{uploads?.map((upload, index) => (
				<div key={index} id={`file-preview-${index}`}>
					<MessageComposerFile upload={upload} onRemove={handleRemoveUpload} onEdit={handleEditFileName} />
				</div>
			))}
		</Box>
	);
};

export default MessageComposerFileArea;
