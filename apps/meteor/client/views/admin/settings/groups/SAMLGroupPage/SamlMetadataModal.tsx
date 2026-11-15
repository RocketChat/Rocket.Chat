import { Box, Callout, Field, FieldLabel, FieldRow, TextAreaInput, TextInput } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type SamlMetadataValues = {
	cert?: string;
	entryPoint?: string;
	idpSLORedirectURL?: string;
	identifierFormat?: string;
};

type SamlMetadataFetchResult = SamlMetadataValues & { warnings: string[] };

type SamlMetadataModalProps = {
	onClose: () => void;
	onFetch: (url: string) => Promise<SamlMetadataFetchResult>;
	onApply: (values: SamlMetadataValues) => void;
	showIdentifierFormat?: boolean;
};

const KNOWN_SAML_METADATA_ERROR_KEYS = [
	'SAML_Metadata_url_blocked',
	'SAML_Metadata_fetch_failed',
	'SAML_Metadata_too_large',
	'SAML_Metadata_invalid',
];

const getSamlMetadataErrorKey = (error: unknown): string => {
	const key = (error as { error?: unknown } | undefined)?.error;
	return typeof key === 'string' && KNOWN_SAML_METADATA_ERROR_KEYS.includes(key) ? key : 'SAML_Metadata_fetch_failed';
};

const SamlMetadataModal = ({ onClose, onFetch, onApply, showIdentifierFormat = false }: SamlMetadataModalProps) => {
	const { t } = useTranslation();
	const [url, setUrl] = useState('');
	const [fetching, setFetching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [warnings, setWarnings] = useState<string[]>([]);
	const [values, setValues] = useState<SamlMetadataValues | null>(null);
	const urlFieldId = useId();
	const certFieldId = useId();
	const entryPointFieldId = useId();
	const sloFieldId = useId();
	const identifierFormatFieldId = useId();

	const handleFetch = async () => {
		if (!url.trim()) {
			return;
		}
		setFetching(true);
		setError(null);
		try {
			const { cert, entryPoint, idpSLORedirectURL, identifierFormat, warnings: fetchWarnings } = await onFetch(url.trim());
			setValues({ cert, entryPoint, idpSLORedirectURL, identifierFormat });
			setWarnings(fetchWarnings);
		} catch (e) {
			setError(getSamlMetadataErrorKey(e));
		} finally {
			setFetching(false);
		}
	};

	const handleApply = () => {
		if (values) {
			onApply(values);
		}
	};

	const setValue = (key: keyof SamlMetadataValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { value } = event.currentTarget;
		setValues((current) => ({ ...current, [key]: value }));
	};

	return (
		<GenericModal
			variant='info'
			title={t('SAML_Import_metadata')}
			confirmText={values ? t('Apply') : t('SAML_Metadata_fetch')}
			cancelText={t('Cancel')}
			wrapperFunction={(props) => (
				<Box
					is='form'
					onSubmit={(e) => {
						e.preventDefault();
						if (values) {
							handleApply();
						} else {
							void handleFetch();
						}
					}}
					{...props}
				/>
			)}
			onCancel={onClose}
			onClose={onClose}
			confirmDisabled={fetching || (!values && url.trim() === '')}
			confirmLoading={fetching}
		>
			<Box display='flex' flexDirection='column'>
				<Box marginBlockEnd={16}>{t('SAML_Metadata_modal_description')}</Box>
				<Field>
					<FieldLabel htmlFor={urlFieldId}>{t('SAML_Metadata_url')}</FieldLabel>
					<FieldRow>
						<TextInput
							id={urlFieldId}
							value={url}
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								setUrl(e.currentTarget.value);
								setValues(null);
								setError(null);
								setWarnings([]);
							}}
						/>
					</FieldRow>
				</Field>
				{error && (
					<Callout type='danger' marginBlockStart={16}>
						{t(error as Parameters<typeof t>[0])}
					</Callout>
				)}
				{warnings.map((warning) => (
					<Callout key={warning} type='warning' marginBlockStart={16}>
						{t(warning as Parameters<typeof t>[0])}
					</Callout>
				))}
				{values && (
					<>
						<Field marginBlockStart={16}>
							<FieldLabel htmlFor={entryPointFieldId}>{t('SAML_Custom_Entry_point')}</FieldLabel>
							<FieldRow>
								<TextInput
									id={entryPointFieldId}
									value={values.entryPoint ?? ''}
									placeholder={t('SAML_Metadata_not_found')}
									onChange={setValue('entryPoint')}
								/>
							</FieldRow>
						</Field>
						<Field marginBlockStart={16}>
							<FieldLabel htmlFor={sloFieldId}>{t('SAML_Custom_IDP_SLO_Redirect_URL')}</FieldLabel>
							<FieldRow>
								<TextInput
									id={sloFieldId}
									value={values.idpSLORedirectURL ?? ''}
									placeholder={t('SAML_Metadata_not_found')}
									onChange={setValue('idpSLORedirectURL')}
								/>
							</FieldRow>
						</Field>
						<Field marginBlockStart={16}>
							<FieldLabel htmlFor={certFieldId}>{t('SAML_Custom_Cert')}</FieldLabel>
							<FieldRow>
								<TextAreaInput
									id={certFieldId}
									rows={5}
									value={values.cert ?? ''}
									placeholder={t('SAML_Metadata_not_found')}
									onChange={setValue('cert')}
								/>
							</FieldRow>
						</Field>
						{showIdentifierFormat && (
							<Field marginBlockStart={16}>
								<FieldLabel htmlFor={identifierFormatFieldId}>{t('SAML_Identifier_Format')}</FieldLabel>
								<FieldRow>
									<TextInput
										id={identifierFormatFieldId}
										value={values.identifierFormat ?? ''}
										placeholder={t('SAML_Metadata_not_found')}
										onChange={setValue('identifierFormat')}
									/>
								</FieldRow>
							</Field>
						)}
					</>
				)}
			</Box>
		</GenericModal>
	);
};

export default SamlMetadataModal;
