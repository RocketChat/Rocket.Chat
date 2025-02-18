import type { MessageAttachment, IWebdavAccount } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Modal, Box, Button, FieldGroup, Field, FieldLabel, FieldRow, FieldError, Select, Throbber } from '@rocket.chat/fuselage';
import { useMethod, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useState, useMemo, useEffect, useRef, useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const dispatchToastMessage = useToastMessageDispatch();
	const uploadFileToWebdav = useMethod('uploadFileToWebdav');
	const fileRequest = useRef<XMLHttpRequest | null>(null);
	const accountIdField = useId();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<{ accountId: string }>({ mode: 'all' });

	const enabled = useSetting<boolean>('Webdav_Integration_Enabled', false);

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
				try {
					if (!title) {
						throw new Error('File name is required');
					}
					const response = await uploadFileToWebdav(accountId, arrayBuffer, title);
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
									rules={{ required: t('Required_field', { field: t('Select_a_webdav_server') }) }}
									render={({ field }): ReactElement => (
										<Select {...field} options={accountsOptions} id={accountIdField} placeholder={t('Select_an_option')} />
									)}
								/>
							</FieldRow>
							{errors.accountId && <FieldError>{errors.accountId.message}</FieldError>}
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
