import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MessageComposerFile from './MessageComposerFile';
import type { Upload } from '../../../../lib/chats/Upload';

type MessageComposerFileAreaProps = {
	uploads?: readonly Upload[];
	onRemove: (id: Upload['id']) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
	onCancel: (id: Upload['id']) => void;
};

const MessageComposerFileArea = ({ uploads, onRemove, onEdit, onCancel }: MessageComposerFileAreaProps) => {
	const { t } = useTranslation();
	return (
		<Box
			role='group'
			aria-label={t('Uploads')}
			display='flex'
			width='100%'
			flexDirection='row'
			pi={8}
			pbe={8}
			pbs={2}
			overflowX='auto'
			style={{ whiteSpace: 'nowrap' }}
		>
			{uploads?.map((upload) => (
				<div key={upload.id}>
					<MessageComposerFile upload={upload} onRemove={onRemove} onEdit={onEdit} onCancel={onCancel} />
				</div>
			))}
		</Box>
	);
};

export default MessageComposerFileArea;
