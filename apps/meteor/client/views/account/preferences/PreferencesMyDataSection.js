import { Accordion, Field, FieldGroup, ButtonGroup, Button, Icon, Box } from '@rocket.chat/fuselage';
import { useSetModal, useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import MyDataModal from './MyDataModal';

const PreferencesMyDataSection = ({ onChange, ...props }) => {
	const t = useTranslation();

	const setModal = useSetModal();

	const requestDataDownload = useMethod('requestDataDownload');

	const dispatchToastMessage = useToastMessageDispatch();

	const closeModal = useCallback(() => setModal(null), [setModal]);

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
							onCancel={closeModal}
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
								onCancel={closeModal}
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
							onCancel={closeModal}
						/>,
					);

					return;
				}

				setModal(<MyDataModal title={t('UserDataDownload_Requested')} onCancel={closeModal} />);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeModal, dispatchToastMessage, requestDataDownload, setModal, t],
	);

	const handleClickDownload = useCallback(() => downloadData(false), [downloadData]);
	const handleClickExport = useCallback(() => downloadData(true), [downloadData]);

	return (
		<Accordion.Item title={t('My Data')} {...props}>
			<FieldGroup>
				<Field>
					<Field.Row>
						<ButtonGroup stretch flexGrow={1}>
							<Button onClick={handleClickDownload}>
								<Icon name='download' size={20} />
								{t('Download_My_Data')}
							</Button>
							<Button onClick={handleClickExport}>
								<Icon name='download' size={20} />
								{t('Export_My_Data')}
							</Button>
						</ButtonGroup>
					</Field.Row>
				</Field>
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesMyDataSection;
