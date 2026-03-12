import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MessageComposerFileItem from './MessageComposerFileItem';
import type { Upload } from '../../../../lib/chats/Upload';

type MessageComposerFileGroupProps = {
	uploads?: readonly Upload[];
	onRemove: (id: Upload['id']) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
	onCancel: (id: Upload['id']) => void;
};

const MessageComposerFileGroup = ({ uploads, onRemove, onEdit, onCancel }: MessageComposerFileGroupProps) => {
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
				<MessageComposerFileItem key={upload.id} upload={upload} onRemove={onRemove} onEdit={onEdit} onCancel={onCancel} />
			))}
		</Box>
	);
};

export default MessageComposerFileGroup;
