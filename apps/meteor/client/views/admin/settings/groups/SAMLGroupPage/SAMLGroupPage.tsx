import type { ISetting } from '@rocket.chat/core-typings';
import { Button } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal, useToastMessageDispatch, useSettingStructure } from '@rocket.chat/ui-contexts';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import SamlMetadataModal from './SamlMetadataModal';
import type { SamlMetadataValues } from './SamlMetadataModal';
import { useEditableSettings, useEditableSettingsDispatch } from '../../../EditableSettingsContext';
import BaseGroupPage from '../BaseGroupPage';

type SAMLGroupPageProps = ISetting & {
	onClickBack?: () => void;
};

function SAMLGroupPage({ _id, i18nLabel, onClickBack, ...group }: SAMLGroupPageProps) {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const parseMetadata = useEndpoint('POST', '/v1/saml.parseMetadata');
	const setModal = useSetModal();
	const closeModal = useStableCallback(() => setModal());
	const dispatch = useEditableSettingsDispatch();

	const certSetting = useSettingStructure('SAML_Custom_Default_cert');
	const entryPointSetting = useSettingStructure('SAML_Custom_Default_entry_point');
	const sloSetting = useSettingStructure('SAML_Custom_Default_idp_slo_redirect_url');
	const identifierFormatSetting = useSettingStructure('SAML_Custom_Default_identifier_format');

	const editableSettings = useEditableSettings(useMemo(() => ({ group: _id }), [_id]));
	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	const handleApply = useStableCallback((values: SamlMetadataValues) => {
		// identifier_format is only registered on Enterprise installs; skip any setting that isn't present.
		const add = (setting: ISetting | undefined, value?: string) =>
			setting && value !== undefined ? [{ _id: setting._id, value, changed: JSON.stringify(setting.value) !== JSON.stringify(value) }] : [];

		const changes = [
			...add(certSetting, values.cert),
			...add(entryPointSetting, values.entryPoint),
			...add(sloSetting, values.idpSLORedirectURL),
			...add(identifierFormatSetting, values.identifierFormat),
		];

		dispatch(changes);
		closeModal();

		if (changes.length === 0) {
			dispatchToastMessage({ type: 'warning', message: t('SAML_Metadata_no_values') });
			return;
		}

		dispatchToastMessage({ type: 'success', message: t('SAML_Metadata_applied') });
	});

	const handleImportClick = () =>
		setModal(
			<SamlMetadataModal
				onClose={closeModal}
				onFetch={(url) => parseMetadata({ url })}
				onApply={handleApply}
				showIdentifierFormat={identifierFormatSetting !== undefined}
			/>,
		);

	return (
		<BaseGroupPage
			_id={_id}
			i18nLabel={i18nLabel}
			onClickBack={onClickBack}
			{...group}
			headerButtons={
				<Button disabled={changed} onClick={handleImportClick}>
					{t('SAML_Import_metadata')}
				</Button>
			}
		/>
	);
}

export default memo(SAMLGroupPage);
