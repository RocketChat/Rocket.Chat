import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { FieldLabel, Field, FieldRow, TextAreaInput } from '@rocket.chat/fuselage-forms';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { GenericModal, useInvalidateLicense } from '@rocket.chat/ui-client';
import { useSettingSetValue, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import LicenseFilePreview from './LicenseFilePreview';
import LicenseStatus from './LicenseStatus';
import { getLicenseInvalidMessage } from './getLicenseInvalidMessage';
import { useLicenseFileInput } from './useLicenseFileInput';
import { isPlausibleLicense, useValidateLicense } from '../../../../hooks/useValidateLicense';

type ManageLicenseModalProps = {
	enterpriseLicense: string;
	onCancel: () => void;
};

const ManageLicenseModal = ({ enterpriseLicense, onCancel }: ManageLicenseModalProps) => {
	const { t } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);

	const dispatchToastMessage = useToastMessageDispatch();
	const setEnterpriseLicense = useSettingSetValue('Enterprise_License');
	const invalidateLicense = useInvalidateLicense();

	const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);

	const {
		selectedFile,
		fileError,
		license,
		isDragOver,
		handleRemoveFile,
		handleFile,
		handleDrop,
		handleDragLeave,
		handleDragOver,
		handleTextChange,
	} = useLicenseFileInput(enterpriseLicense);

	const trimmedLicense = license.trim();
	const debouncedLicense = useDebouncedValue(trimmedLicense, 500);
	const { data: validation, isPending, isError } = useValidateLicense(debouncedLicense);

	const isEmpty = trimmedLicense === '';
	const isPlausible = isPlausibleLicense(trimmedLicense);
	const isValidating = isPlausible && (trimmedLicense !== debouncedLicense || isPending);

	const isCurrentLicense = !isEmpty && trimmedLicense === enterpriseLicense.trim();

	const isLicenseValid = !fileError && !isError && validation?.valid === true;

	const invalidMessage = (() => {
		if (fileError) {
			return fileError;
		}

		if (isError) {
			return t('License_error_generic');
		}

		return t(getLicenseInvalidMessage(validation?.reasons ?? []));
	})();

	const showStatus = isPlausible || Boolean(fileError);

	const handleApply = async () => {
		try {
			await setEnterpriseLicense(license);
			invalidateLicense(100);
			onCancel();
			dispatchToastMessage({ type: 'success', message: t('Cloud_License_applied_successfully') });
		} catch (err) {
			dispatchToastMessage({ type: 'error', message: err });
		}
	};

	const handleRemove = async () => {
		try {
			await setEnterpriseLicense('');
			invalidateLicense(100);
			onCancel();
			dispatchToastMessage({ type: 'success', message: t('License_removed_successfully') });
		} catch (err) {
			dispatchToastMessage({ type: 'error', message: err });
		}
	};

	if (isConfirmingRemoval) {
		return (
			<GenericModal
				variant='secondary-danger'
				title={t('Remove_license_key')}
				confirmText={t('Apply_community_license')}
				onConfirm={handleRemove}
				onCancel={() => setIsConfirmingRemoval(false)}
			>
				<Box display='flex' flexDirection='column' gap={16}>
					<Box>{t('Remove_license_confirmation')}</Box>
					<Box>{t('Are_you_sure_you_want_to_continue_question')}</Box>
					<Box fontScale='c1' color='secondary-info'>
						{t('Remove_license_disclaimer')}
					</Box>
				</Box>
			</GenericModal>
		);
	}

	return (
		<GenericModal
			icon={null}
			variant='warning'
			title={t('Manage_license')}
			confirmText={t('Apply_license')}
			confirmDisabled={!isLicenseValid || isCurrentLicense || isValidating}
			onConfirm={handleApply}
			onCancel={onCancel}
		>
			<Box fontScale='p2' mbe={8}>
				{t('Manage_license_description')}
			</Box>
			<Box
				is='input'
				ref={inputRef}
				type='file'
				accept='.txt,text/plain'
				aria-label={t('Upload_license_file')}
				display='none'
				onChange={(event: ChangeEvent<HTMLInputElement>) => {
					void handleFile(event.currentTarget.files?.[0]);
					// Reset so selecting the same file again still fires onChange.
					event.currentTarget.value = '';
				}}
			/>
			{selectedFile && <LicenseFilePreview selectedFile={selectedFile} handleRemoveFile={handleRemoveFile} />}
			<Field>
				<FieldLabel>{t('License_key')}</FieldLabel>
				<FieldRow>
					<TextAreaInput
						withRichContent
						mbe={8}
						width='100%'
						bg={isDragOver ? 'tint' : undefined}
						borderStyle={isDragOver ? 'dashed' : 'solid'}
						borderColor={isDragOver ? 'stroke-highlight' : 'stroke-light'}
						style={{ fontFamily: 'monospace' }}
						rows={4}
						placeholder={t('Drag_and_drop_license_placeholder')}
						value={license}
						onChange={handleTextChange}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragEnter={handleDragOver}
						onDragLeave={handleDragLeave}
					/>
				</FieldRow>
			</Field>
			<ButtonGroup>
				<Button icon='upload' small onClick={() => inputRef.current?.click()}>
					{t('Upload_license_file')}
				</Button>
				{isCurrentLicense && (
					<Button icon='trash' small secondary danger onClick={() => setIsConfirmingRemoval(true)}>
						{t('Remove_license')}
					</Button>
				)}
			</ButtonGroup>
			{showStatus && (
				<Box mbs={16}>
					<LicenseStatus isValidating={isValidating} isValid={isLicenseValid} invalidMessage={invalidMessage} />
				</Box>
			)}
		</GenericModal>
	);
};

export default ManageLicenseModal;
