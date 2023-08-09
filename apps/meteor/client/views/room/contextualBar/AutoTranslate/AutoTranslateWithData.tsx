import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLanguage } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useEffect, useState, memo } from 'react';

import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';
import { useRoomToolbox } from '../../contexts/RoomToolboxContext';
import AutoTranslate from './AutoTranslate';

const AutoTranslateWithData = (): ReactElement => {
	const room = useRoom();
	const subscription = useRoomSubscription();
	const { closeTab } = useRoomToolbox();
	const userLanguage = useLanguage();
	const [currentLanguage, setCurrentLanguage] = useState(subscription?.autoTranslateLanguage ?? '');
	const saveSettings = useEndpointAction('POST', '/v1/autotranslate.saveSettings');

	const { value: translateData } = useEndpointData('/v1/autotranslate.getSupportedLanguages', {
		params: useMemo(() => ({ targetLanguage: userLanguage }), [userLanguage]),
	});

	const handleChangeLanguage = useMutableCallback((value) => {
		setCurrentLanguage(value);

		saveSettings({
			roomId: room._id,
			field: 'autoTranslateLanguage',
			value,
		});
	});

	const handleSwitch = useMutableCallback((event) => {
		saveSettings({
			roomId: room._id,
			field: 'autoTranslate',
			value: event.target.checked,
		});
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
