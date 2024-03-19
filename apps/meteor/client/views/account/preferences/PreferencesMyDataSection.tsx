import { Accordion, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import MyDataModal from './MyDataModal';

const PreferencesMyDataSection = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const requestDataDownload = useMethod('requestDataDownload');

	const downloadData = useCallback(
		async (fullExport) => {
			try {
				const result = await requestDataDownload({ fullExport });
				if (result.requested) {
					const text = t('UserDataDownload_Requested_Text', {
						pending_operations: result.pendingOperationsBeforeMyRequest,
					});
					setModal(
						<MyDataModal
							title={t('UserDataDownload_Requested')}
							text={<Box dangerouslySetInnerHTML={{ __html: text }} />}
							onCancel={() => setModal(null)}
						/>,
					);
					return;
				}

				if (result.exportOperation) {
					if (result.exportOperation.status === 'completed') {
						const text = result.url
							? t('UserDataDownload_CompletedRequestExistedWithLink_Text', {
									download_link: result.url,
							  })
							: t('UserDataDownload_CompletedRequestExisted_Text');

						setModal(
							<MyDataModal
								title={t('UserDataDownload_Requested')}
								text={<Box dangerouslySetInnerHTML={{ __html: text }} />}
								onCancel={() => setModal(null)}
							/>,
						);

						return;
					}

					const text = t('UserDataDownload_RequestExisted_Text', {
						pending_operations: result.pendingOperationsBeforeMyRequest,
					});
					setModal(
						<MyDataModal
							title={t('UserDataDownload_Requested')}
							text={<Box dangerouslySetInnerHTML={{ __html: text }} />}
							onCancel={() => setModal(null)}
						/>,
					);

					return;
				}

				setModal(<MyDataModal title={t('UserDataDownload_Requested')} onCancel={() => setModal(null)} />);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[dispatchToastMessage, requestDataDownload, setModal, t],
	);

	const handleClickDownload = useCallback(() => downloadData(false), [downloadData]);
	const handleClickExport = useCallback(() => downloadData(true), [downloadData]);

	return (
		<Accordion.Item title={t('My Data')}>
			<ButtonGroup stretch>
				<Button icon='download' onClick={handleClickDownload}>
					{t('Download_My_Data')}
				</Button>
				<Button icon='download' onClick={handleClickExport}>
					{t('Export_My_Data')}
				</Button>
			</ButtonGroup>
		</Accordion.Item>
	);
};

export default PreferencesMyDataSection;
