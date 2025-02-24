import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useLanguage } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import { useMemo, useEffect, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';

import AutoTranslate from './AutoTranslate';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { dispatchToastMessage } from '../../../../lib/toast';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';

const AutoTranslateWithData = (): ReactElement => {
	const room = useRoom();
	const subscription = useRoomSubscription();
	const { closeTab } = useRoomToolbox();
	const userLanguage = useLanguage();
	const [currentLanguage, setCurrentLanguage] = useState(subscription?.autoTranslateLanguage ?? '');
	const saveSettings = useEndpointAction('POST', '/v1/autotranslate.saveSettings');
	const { t } = useTranslation();

	const { value: translateData } = useEndpointData('/v1/autotranslate.getSupportedLanguages', {
		params: useMemo(() => ({ targetLanguage: userLanguage }), [userLanguage]),
	});
	const languagesDict = translateData ? Object.fromEntries(translateData.languages.map((lang) => [lang.language, lang.name])) : {};

	const handleChangeLanguage = useEffectEvent((value: string) => {
		setCurrentLanguage(value);

		saveSettings({
			roomId: room._id,
			field: 'autoTranslateLanguage',
			value,
		});
		dispatchToastMessage({
			type: 'success',
			message: t('AutoTranslate_language_set_to', { language: languagesDict[value] }),
		});
	});

	const handleSwitch = useEffectEvent((event: ChangeEvent<HTMLInputElement>) => {
		saveSettings({
			roomId: room._id,
			field: 'autoTranslate',
			value: event.target.checked,
		});
		dispatchToastMessage({
			type: 'success',
			message: event.target.checked
				? t('AutoTranslate_Enabled_for_room', { roomName: room.name })
				: t('AutoTranslate_Disabled_for_room', { roomName: room.name }),
		});
		if (event.target.checked && currentLanguage) {
			dispatchToastMessage({
				type: 'success',
				message: t('AutoTranslate_language_set_to', { language: languagesDict[currentLanguage] }),
			});
		}
	});

	useEffect(() => {
		if (!subscription?.autoTranslate) {
			return;
		}

		if (!subscription?.autoTranslateLanguage) {
			handleChangeLanguage(userLanguage);
		}
	}, [subscription?.autoTranslate, subscription?.autoTranslateLanguage, handleChangeLanguage, userLanguage]);

	return (
		<AutoTranslate
			language={currentLanguage}
			languages={translateData ? translateData.languages.map((language) => [language.language, language.name]) : []}
			handleSwitch={handleSwitch}
			handleChangeLanguage={handleChangeLanguage}
			translateEnable={!!subscription?.autoTranslate}
			handleClose={closeTab}
		/>
	);
};

export default memo(AutoTranslateWithData);
