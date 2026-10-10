import type { SettingValue } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import RequiredAttributesRemovalModal from './RequiredAttributesRemovalModal';
import SettingField from './SettingField';
import { useEditableSetting } from '../../EditableSettingsContext';
import type { SettingLookupEndpoint } from '../../settings/hooks/useSettingLookupOptions';
import { useSettingLookupQuery } from '../../settings/hooks/useSettingLookupOptions';

const toKeys = (value: SettingValue): string[] => (Array.isArray(value) ? value.map(String) : []);

const RequiredAttributesField = () => {
	const setting = useEditableSetting('ABAC_Required_Attributes');
	const lookupEndpoint = (setting?.lookupEndpoint ?? 'v1/abac/attribute-keys') as SettingLookupEndpoint;
	const { data: options, isSuccess, isPending } = useSettingLookupQuery(lookupEndpoint);
	const setModal = useSetModal();

	const storedKeys = toKeys(setting?.value);

	const onBeforeChange = useCallback(
		(next: SettingValue, proceed: () => void) => {
			const nextKeys = toKeys(next);
			const removedKeys = storedKeys.filter((key) => !nextKeys.includes(key));

			if (removedKeys.length === 0) {
				proceed();
				return;
			}

			const keysToConfirm = isSuccess ? removedKeys.filter((key) => !options.some((option) => option.key === key)) : removedKeys;

			if (keysToConfirm.length === 0) {
				proceed();
				return;
			}

			setModal(
				<RequiredAttributesRemovalModal
					attributeKeys={keysToConfirm}
					entitlementsKnown={isSuccess}
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

	return <SettingField settingId='ABAC_Required_Attributes' disabled={isPending} onBeforeChange={onBeforeChange} />;
};

export default RequiredAttributesField;
