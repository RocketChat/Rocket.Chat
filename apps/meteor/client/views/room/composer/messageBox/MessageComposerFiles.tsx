import { MessageComposerFileGroup } from '@rocket.chat/ui-composer';
import { useTranslation } from 'react-i18next';

import MessageComposerFileItem from './MessageComposerFileItem';
import type { Upload } from '../../../../lib/chats/Upload';

type MessageComposerFileGroupProps = {
	uploads?: readonly Upload[];
	onRemove: (id: Upload['id']) => void;
	onEdit: (id: Upload['id'], fileName: string) => void;
	onCancel: (id: Upload['id']) => void;
	onPause: (id: Upload['id']) => void;
	onResume: (id: Upload['id']) => void;
	disabled: boolean;
};

const MessageComposerFiles = ({ uploads, onRemove, onEdit, onCancel, onPause, onResume, disabled }: MessageComposerFileGroupProps) => {
	const { t } = useTranslation();
	return (
		<MessageComposerFileGroup aria-label={t('Uploads')}>
			{uploads?.map((upload) => (
				<MessageComposerFileItem
					key={upload.id}
					upload={upload}
					onRemove={onRemove}
					onEdit={onEdit}
					onCancel={onCancel}
					onPause={onPause}
					onResume={onResume}
					disabled={disabled}
				/>
			))}
		</MessageComposerFileGroup>
	);
};

export default MessageComposerFiles;
