import React, { useCallback } from 'react';
import { Accordion, Field, FieldGroup, ButtonGroup, Button, Icon, Box, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useMethod } from '../../contexts/ServerContext';
import { useSetModal } from '../../contexts/ModalContext';

const MyDataModal = ({ onCancel, title, text, ...props }) => {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Icon color='success' name='circle-check' size={20}/>
			<Modal.Title>{title}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Box mb='x8'>{text}</Box>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onCancel}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const PreferencesMyDataSection = ({ onChange, ...props }) => {
	const t = useTranslation();

	const setModal = useSetModal();

	const requestDataDownload = useMethod('requestDataDownload');

	const dispatchToastMessage = useToastMessageDispatch();

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const downloadData = useCallback(async (fullExport) => {
		try {
			const result = await requestDataDownload({ fullExport });
			if (result.requested) {
				const text = t('UserDataDownload_Requested_Text', { pending_operations: result.pendingOperationsBeforeMyRequest });
				setModal(<MyDataModal
					title={t('UserDataDownload_Requested')}
					text={<Box dangerouslySetInnerHTML={{ __html: text }} />}
					onCancel={closeModal}
				/>);
				return;
			}

			if (result.exportOperation) {
				if (result.exportOperation.status === 'completed') {
					const text = result.url
						? t('UserDataDownload_CompletedRequestExistedWithLink_Text', { download_link: result.url })
						: t('UserDataDownload_CompletedRequestExisted_Text');

					setModal(<MyDataModal
						title={t('UserDataDownload_Requested')}
						text={<Box dangerouslySetInnerHTML={{ __html: text }} />}
						onCancel={closeModal}
					/>);

					return;
				}

				const text = t('UserDataDownload_RequestExisted_Text', { pending_operations: result.pendingOperationsBeforeMyRequest });
				setModal(<MyDataModal
					title={t('UserDataDownload_Requested')}
					text={<Box dangerouslySetInnerHTML={{ __html: text }} />}
					onCancel={closeModal}
				/>);

				return;
			}

			setModal(<MyDataModal
				title={t('UserDataDownload_Requested')}
				onCancel={closeModal}
			/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [closeModal, dispatchToastMessage, requestDataDownload, setModal, t]);

	const handleClickDownload = useCallback(() => downloadData(false), [downloadData]);
	const handleClickExport = useCallback(() => downloadData(true), [downloadData]);

	return <Accordion.Item title={t('My Data')} {...props}>
		<FieldGroup>
			<Field>
				<Field.Row>
					<ButtonGroup stretch flexGrow={1}>
						<Button onClick={handleClickDownload}>
							<Icon name='download' size={20}/>
							{t('Download_My_Data')}
						</Button>
						<Button onClick={handleClickExport}>
							<Icon name='download' size={20}/>
							{t('Export_My_Data')}
						</Button>
					</ButtonGroup>
				</Field.Row>
			</Field>
		</FieldGroup>
	</Accordion.Item>;
};

export default PreferencesMyDataSection;
