import type { MessageAttachment, IWebdavAccount } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Modal, Box, Button, FieldGroup, Field, FieldLabel, FieldRow, FieldError, Select, Throbber } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useMethod, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { useWebDAVAccountIntegrationsQuery } from '../../../hooks/webdav/useWebDAVAccountIntegrationsQuery';
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

	const enabled = true;
	useSetting<boolean>('Webdav_Integration_Enabled', false);

	const { data: value } = useWebDAVAccountIntegrationsQuery({ enabled });

	const accountsOptions: SelectOption[] = useMemo(() => {
		return value?.map(({ _id, ...current }) => [_id, getWebdavServerName(current)]) ?? [];
	}, [value]);

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
					if (!title) {
						throw new Error('File name is required');
					}
					const response = await uploadFileToWebdav(accountId, fileData, title);
					if (!response.success) {
						throw new Error(response.message ? t(response.message) : 'Error uploading file');
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
		<Modal wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleSaveFile)} {...props} />}>
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
							<FieldLabel>{t('Select_a_webdav_server')}</FieldLabel>
							<FieldRow>
								<Controller
									name='accountId'
									control={control}
									rules={{ required: true }}
									render={({ field }): ReactElement => (
										<Select {...field} options={accountsOptions} id={accountIdField} placeholder={t('Select_an_option')} />
									)}
								/>
							</FieldRow>
							{errors.accountId && <FieldError>{t('Field_required')}</FieldError>}
						</Field>
					</FieldGroup>
				)}
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary type='submit' loading={isLoading}>
						{t('Save_To_Webdav')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};
export default SaveToWebdavModal;
