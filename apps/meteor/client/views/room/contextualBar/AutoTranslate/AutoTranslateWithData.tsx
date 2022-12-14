import type { IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserSubscription, useLanguage } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useEffect, useState, memo } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointActionExperimental';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTabBarClose } from '../../contexts/ToolboxContext';
import AutoTranslate from './AutoTranslate';

const AutoTranslateWithData = ({ rid }: { rid: IRoom['_id'] }): ReactElement => {
	const handleClose = useTabBarClose();
	const userLanguage = useLanguage();
	const subscription = useUserSubscription(rid);
	const [currentLanguage, setCurrentLanguage] = useState(subscription?.autoTranslateLanguage ?? '');
	const saveSettings = useEndpointActionExperimental('POST', '/v1/autotranslate.saveSettings');

	const { value: translateData } = useEndpointData(
		'/v1/autotranslate.getSupportedLanguages',
		useMemo(() => ({ targetLanguage: userLanguage }), [userLanguage]),
	);

	const handleChangeLanguage = useMutableCallback((value) => {
		setCurrentLanguage(value);

		saveSettings({
			roomId: rid,
			field: 'autoTranslateLanguage',
			value,
		});
	});

	const handleSwitch = useMutableCallback((event) => {
		saveSettings({
			roomId: rid,
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
			handleClose={handleClose}
		/>
	);
};

export default memo(AutoTranslateWithData);
