import { AccordionItem, Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import DOMPurify from 'dompurify';
import type { TFunction } from 'i18next';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import MyDataModal from './MyDataModal';
import type { DataDownloadDialog } from '../logic/usePreferences';

export type PreferencesMyDataSectionProps = {
	dialog: DataDownloadDialog | null;
	onRequestDataDownload: (fullExport: boolean) => Promise<void>;
	onDismissDialog: () => void;
};

const getDialogText = (dialog: DataDownloadDialog, t: TFunction): string | undefined => {
	switch (dialog.type) {
		case 'requested':
			return t('UserDataDownload_Requested_Text', { pending_operations: dialog.pendingOperations });
		case 'already-requested':
			return t('UserDataDownload_RequestExisted_Text', { pending_operations: dialog.pendingOperations });
		case 'completed':
			return dialog.url
				? t('UserDataDownload_CompletedRequestExistedWithLink_Text', { download_link: dialog.url })
				: t('UserDataDownload_CompletedRequestExisted_Text');
		case 'acknowledged':
			return undefined;
	}
};

const PreferencesMyDataSection = ({ dialog, onRequestDataDownload, onDismissDialog }: PreferencesMyDataSectionProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	useEffect(() => {
		if (!dialog) {
			return;
		}

		const text = getDialogText(dialog, t);
		setModal(
			<MyDataModal
				title={t('UserDataDownload_Requested')}
				text={text && <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }} />}
				onCancel={onDismissDialog}
			/>,
		);
		return () => setModal(null);
	}, [dialog, onDismissDialog, setModal, t]);

	return (
		<AccordionItem title={t('My Data')}>
			<ButtonGroup stretch>
				<Button icon='download' onClick={() => onRequestDataDownload(false)}>
					{t('Download_My_Data')}
				</Button>
				<Button icon='download' onClick={() => onRequestDataDownload(true)}>
					{t('Export_My_Data')}
				</Button>
			</ButtonGroup>
		</AccordionItem>
	);
};

export default PreferencesMyDataSection;
