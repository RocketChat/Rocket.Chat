import type { SettingValue } from '@rocket.chat/core-typings';
import { useSetModal, useSettingsDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import WarningModal from './WarningModal';
import type { EditableSetting } from '../../EditableSettingsContext';
import { useEditableSetting } from '../../EditableSettingsContext';
import MemoizedSetting from '../../settings/Setting/MemoizedSetting';
import SettingSkeleton from '../../settings/Setting/SettingSkeleton';

type ABACEnabledToggleProps = {
	hasABAC: 'loading' | boolean;
};

const ABACEnabledToggle = ({ hasABAC }: ABACEnabledToggleProps) => {
	const setting = useEditableSetting('ABAC_Enabled');
	const setModal = useSetModal();
	const dispatch = useSettingsDispatch();
	const { t } = useTranslation();

	const [value, setValue] = useState<boolean>(setting?.value === true);

	useEffect(() => {
		setValue(setting?.value === true);
	}, [setting]);

	const onChange = useCallback(
		(value: boolean) => {
			if (!setting) {
				return;
			}

			const handleChange = (value: boolean, setting: EditableSetting) => {
				setValue(value);
				dispatch([{ _id: setting._id, value }]);
			};

			if (value === false) {
				return setModal(
					<WarningModal
						onConfirm={() => {
							handleChange(value, setting);
							setModal();
						}}
						onCancel={() => setModal()}
					/>,
				);
			}
			handleChange(value, setting);
		},
		[dispatch, setModal, setting],
	);

	const onReset = useCallback(() => {
		if (!setting) {
			return;
		}
		const value = setting.packageValue as boolean;
		setModal(
			<WarningModal
				onConfirm={() => {
					setValue(value);
					dispatch([{ _id: setting._id, value }]);
					setModal();
				}}
				onCancel={() => setModal()}
			/>,
		);
	}, [dispatch, setModal, setting]);

	if (!setting) {
		return null;
	}

	if (hasABAC === 'loading') {
		return <SettingSkeleton />;
	}

	return (
		<MemoizedSetting
			type='boolean'
			_id={setting._id}
			label={t(setting.i18nLabel)}
			value={value}
			packageValue={setting.packageValue === true}
			hint={t(setting.i18nDescription || '')}
			disabled={!hasABAC || setting.blocked}
			hasResetButton={hasABAC && setting.packageValue !== setting.value}
			onChangeValue={(value: SettingValue) => onChange(value === true)}
			onResetButtonClick={() => onReset()}
		/>
	);
};
export default ABACEnabledToggle;
