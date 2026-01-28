import type { AllHTMLAttributes, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import MessageComposerFileComponent from './MessageComposerFileComponent';

type MessageComposerFileComponentProps = {
	fileTitle: string;
	error: Error;
	actionIcon: ReactElement;
} & AllHTMLAttributes<HTMLButtonElement>;

const MessageComposerFileError = ({ fileTitle, error, actionIcon, ...props }: MessageComposerFileComponentProps) => {
	const { t } = useTranslation();

	return (
		<MessageComposerFileComponent
			error={Boolean(error)}
			fileTitle={fileTitle}
			fileSubtitle={t('Upload_failed')}
			actionIcon={actionIcon}
			title={error.message}
			{...props}
		/>
	);
};

export default MessageComposerFileError;
