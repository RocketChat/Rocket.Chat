import { MessageAttachment, IWebdavAccount } from '@rocket.chat/core-typings';
import { Modal, Box, Button, FieldGroup, Field, Select, SelectOption, Throbber } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState, useMemo, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useEndpointData } from '../../../hooks/useEndpointData';
import { getWebdavServerName } from '../../../lib/getWebdavServerName';

type SaveToWebdavModalProps = {
	onClose: () => void;
	data: {
		attachment: MessageAttachment;
		url: string;
	};
};

const SaveToWebdavModal = ({ onClose, data }: SaveToWebdavModalProps): ReactElement => {
	const t = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const uploadFileToWebdav = useMethod('uploadFileToWebdav');
	const fileRequest = useRef<XMLHttpRequest | null>(null);
	const accountIdField = useUniqueId();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<{ accountId: string }>();

	const { value } = useEndpointData('/v1/webdav.getMyAccounts');

	const accountsOptions: SelectOption[] = useMemo(() => {
		if (value?.accounts) {
			return value.accounts.map(({ _id, ...current }) => [_id, getWebdavServerName(current)]);
		}

		return [];
	}, [value?.accounts]);

	useEffect(() => fileRequest.current?.abort, []);

	const handleSaveFile = ({ accountId }: { accountId: IWebdavAccount['_id'] }): void => {
		setIsLoading(true);

		const {
			url,
			attachment: { title },
		} = data;

		fileRequest.current = new XMLHttpRequest();
		fileRequest.current.open('GET', url, true);
		fileRequest.current.responseType = 'arraybuffer';
		fileRequest.current.onload = async (): Promise<void> => {
			const arrayBuffer = fileRequest.current?.response;
			if (arrayBuffer) {
				const fileData = new Uint8Array(arrayBuffer);

				try {
					const response = await uploadFileToWebdav(accountId, fileData, title);
					if (!response.success) {
						return dispatchToastMessage({ type: 'error', message: t(response.message) });
					}
					return dispatchToastMessage({ type: 'success', message: t('File_uploaded') });
				} catch (error) {
					return dispatchToastMessage({ type: 'error', message: error });
				} finally {
					setIsLoading(false);
					onClose();
				}
			}
		};
		fileRequest.current.send(null);
	};

	return (
		<Modal is='form' onSubmit={handleSubmit(handleSaveFile)}>
			<Modal.Header>
				<Modal.Title>{t('Save_To_Webdav')}</Modal.Title>
				<Modal.Close title={t('Close')} onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				{isLoading && (
					<Box alignItems='center' display='flex' justifyContent='center' minHeight='x32'>
						<Throbber />
					</Box>
				)}
				{!isLoading && (
					<FieldGroup>
						<Field>
							<Field.Label>{t('Select_a_webdav_server')}</Field.Label>
							<Field.Row>
								<Controller
									name='accountId'
									control={control}
									rules={{ required: true }}
									render={({ field }): ReactElement => (
										<Select {...field} options={accountsOptions} id={accountIdField} placeholder={t('Select_an_option')} />
									)}
								/>
							</Field.Row>
							{errors.accountId && <Field.Error>{t('Field_required')}</Field.Error>}
						</Field>
					</FieldGroup>
				)}
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary type='submit' disabled={isLoading}>
						{isLoading ? t('Please_wait') : t('Save_To_Webdav')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};
export default SaveToWebdavModal;
