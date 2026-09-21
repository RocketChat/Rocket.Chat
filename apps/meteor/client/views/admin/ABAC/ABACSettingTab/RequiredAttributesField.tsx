import type { SettingValue } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import RequiredAttributesRemovalModal from './RequiredAttributesRemovalModal';
import SettingField from './SettingField';
import { useEditableSetting } from '../../EditableSettingsContext';
import type { SettingLookupEndpoint } from '../../settings/hooks/useSettingLookupOptions';
import { useSettingLookupQuery } from '../../settings/hooks/useSettingLookupOptions';

const SETTING_ID = 'ABAC_Required_Attributes';
// Matches the string the setting is registered with, so the query key is shared with
// `MultiLookupSettingInput` on the render before the setting has loaded too.
const LOOKUP_ENDPOINT = 'v1/abac/attribute-keys';

const toKeys = (value: SettingValue): string[] => (Array.isArray(value) ? value.map(String) : []);

/**
 * Under Virtru the option list holds only the acting admin's own entitlements, and a save replaces
 * the whole array, so an admin can drop a requirement they have no way of adding back. Confirm that
 * case and only that case: a modal on every edit gets clicked through.
 */
const RequiredAttributesField = () => {
	const setting = useEditableSetting(SETTING_ID);
	const lookupEndpoint = (setting?.lookupEndpoint ?? LOOKUP_ENDPOINT) as SettingLookupEndpoint;
	const { data: options, isSuccess } = useSettingLookupQuery(lookupEndpoint);
	const setModal = useSetModal();

	const storedKeys = toKeys(setting?.value);

	const onBeforeChange = useCallback(
		(next: SettingValue, proceed: () => void) => {
			const nextKeys = toKeys(next);
			// Until the lookup succeeds we cannot tell what the admin holds, and the modal asserts
			// that they do not hold a key. Never make that claim without the evidence for it.
			const unrestorableKeys = isSuccess
				? storedKeys.filter((key) => !nextKeys.includes(key) && !options.some((option) => option.key === key))
				: [];

			if (unrestorableKeys.length === 0) {
				proceed();
				return;
			}

			setModal(
				<RequiredAttributesRemovalModal
					unrestorableKeys={unrestorableKeys}
					onConfirm={() => {
						proceed();
						setModal();
					}}
					onCancel={() => setModal()}
				/>,
			);
		},
		[isSuccess, options, setModal, storedKeys],
	);

	if (!setting) {
		return null;
	}

	return <SettingField settingId={SETTING_ID} onBeforeChange={onBeforeChange} />;
};

export default RequiredAttributesField;
