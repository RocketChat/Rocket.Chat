import type { ISetting } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export const useShowSettingAlerts = () => {
	const { t, i18n } = useTranslation();
	const setModal = useSetModal();

	const showAlerts = useCallback(
		(persistedSettingsWithAlert: ISetting[]) => {
			return new Promise<boolean>((resolve) => {
				setModal(
					<GenericModal
						variant='danger'
						icon={null}
						maxHeight='x600'
						title={t('Confirm_settings_change')}
						confirmText={t('Save_changes')}
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
						{persistedSettingsWithAlert.map(({ _id, i18nLabel, alert }) => {
							if (!alert) {
								return null;
							}

							const labelText = (i18n.exists(i18nLabel) && t(i18nLabel)) || (i18n.exists(_id) && t(_id)) || i18nLabel || _id;

							return (
								<Box key={_id} mbe={24}>
									<Box fontScale='h4' mbe={8}>
										{labelText}
									</Box>
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
