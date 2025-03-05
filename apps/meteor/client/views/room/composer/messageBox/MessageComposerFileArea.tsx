import { Box } from '@rocket.chat/fuselage';

import MessageComposerFile from './MessageComposerFile';
import type { Upload } from '../../../../lib/chats/Upload';

type MessageComposerFileAreaProps = {
	uploads?: readonly Upload[];
	onRemove: (id: Upload['id']) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
	onCancel: (id: Upload['id']) => void;
};

const MessageComposerFileArea = ({ uploads, onRemove, onEdit, onCancel }: MessageComposerFileAreaProps) => {
	return (
		<Box display='flex' width='100%' flexDirection='row' pi={8} pbe={8} pbs={2} overflowX='auto' style={{ whiteSpace: 'nowrap' }}>
			{uploads?.map((upload) => (
				<div key={upload.id}>
					<MessageComposerFile upload={upload} onRemove={onRemove} onEdit={onEdit} onCancel={onCancel} />
				</div>
			))}
		</Box>
	);
};

export default MessageComposerFileArea;
