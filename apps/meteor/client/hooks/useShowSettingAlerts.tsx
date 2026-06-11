import type { ISetting } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

const getSettingValueDisplay = (settingValue: ISetting['value']): string => {
	if (typeof settingValue === 'string') {
		return settingValue;
	}
	if (typeof settingValue === 'object') {
		return JSON.stringify(settingValue);
	}
	return String(settingValue);
};

export const useShowSettingAlerts = () => {
	const { t, i18n } = useTranslation();
	const setModal = useSetModal();

	const showAlerts = useCallback(
		(persistedSettingsWithAlert: ISetting[], changedSettings: Pick<ISetting, '_id' | 'value'>[]) => {
			return new Promise((resolve) => {
				setModal(
					<GenericModal
						variant='danger'
						title={t('Confirm_setting_change')}
						confirmText={t('Continue')}
						cancelText={t('Cancel')}
						onConfirm={() => {
							resolve(true);
							setModal(null);
						}}
						onCancel={() => {
							resolve(false);
							return setModal(null);
						}}
						onClose={() => {
							resolve(false);
							return setModal(null);
						}}
					>
						{persistedSettingsWithAlert.map((persistedSetting) => {
							const { _id, i18nLabel, alert } = persistedSetting;

							if (!alert) {
								return null;
							}

							const labelText = (i18n.exists(i18nLabel) && t(i18nLabel)) || (i18n.exists(_id) && t(_id)) || i18nLabel || _id;

							const newValue = changedSettings.find(({ _id }) => _id === persistedSetting._id)?.value;

							return (
								<Box gap={4} key={persistedSetting._id}>
									<div>{labelText}</div>
									{/* TODO i18n */}
									<div>From: {getSettingValueDisplay(persistedSetting.value)}</div>
									<div>To: {getSettingValueDisplay(newValue)}</div>
									<Callout type='warning'>
										<Trans
											i18nKey={i18n.exists(alert) ? alert : undefined}
											defaults={alert}
											components={{
												b: <b />,
												strong: <strong />,
												br: <br />,
												ul: <ul />,
												li: <li />,
											}}
										/>
									</Callout>
								</Box>
							);
						})}
					</GenericModal>,
				);
			});
		},
		[t, i18n, setModal],
	);

	return showAlerts;
};
