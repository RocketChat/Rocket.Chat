import type { AllHTMLAttributes, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MessageComposerFile from './MessageComposerFile';

type MessageComposerFileErrorProps = {
	fileTitle: string;
	error: Error;
	actionIcon: ReactElement;
	onClick: () => void;
} & AllHTMLAttributes<HTMLButtonElement>;

const MessageComposerFileError = ({ fileTitle, error, actionIcon, onClick, ...props }: MessageComposerFileErrorProps) => {
	const { t } = useTranslation();

	return (
		<MessageComposerFile
			error={true}
			fileTitle={fileTitle}
			fileSubtitle={t('Upload_failed')}
			actionIcon={actionIcon}
			title={error.message}
			onClick={onClick}
			{...props}
		/>
	);
};

export default MessageComposerFileError;
