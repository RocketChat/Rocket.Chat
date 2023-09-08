import { Option, OptionContent, OptionIcon } from '@rocket.chat/fuselage';
import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { useTranslation, useSetting } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, AllHTMLAttributes } from 'react';
import React, { useRef } from 'react';

import { useChat } from '../../../../contexts/ChatContext';

type FileUploadActionProps = {
	collapsed?: boolean;
} & Omit<AllHTMLAttributes<HTMLButtonElement>, 'is'>;

const FileUploadAction = ({ collapsed, disabled, ...props }: FileUploadActionProps) => {
	const t = useTranslation();
	const fileUploadEnabled = useSetting('FileUpload_Enabled');
	const fileInputRef = useRef<HTMLInputElement>(null);
	const chat = useChat();

	const handleUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
		const { mime } = await import('../../../../../../../app/utils/lib/mimeTypes');
		const filesToUpload = Array.from(e.target.files ?? []).map((file) => {
			Object.defineProperty(file, 'type', {
				value: mime.lookup(file.name),
			});
			return file;
		});

		chat?.flows.uploadFiles(filesToUpload);
	};

	const handleUpload = () => {
		fileInputRef.current?.click();
	};

	if (collapsed) {
		return (
			<>
				<Option
					{...((!fileUploadEnabled || disabled) && { title: t('Not_Available') })}
					disabled={!fileUploadEnabled || disabled}
					onClick={handleUpload}
				>
					<OptionIcon name='clip' />
					<OptionContent>{t('File')}</OptionContent>
				</Option>
				<input ref={fileInputRef} type='file' onChange={handleUploadChange} multiple style={{ display: 'none' }} />
			</>
		);
	}

	return (
		<>
			<MessageComposerAction
				data-qa-id='file-upload'
				icon='clip'
				disabled={!fileUploadEnabled || disabled}
				onClick={handleUpload}
				title={t('File')}
				{...props}
			/>
			<input ref={fileInputRef} type='file' onChange={handleUploadChange} multiple style={{ display: 'none' }} />
		</>
	);
};

export default FileUploadAction;
