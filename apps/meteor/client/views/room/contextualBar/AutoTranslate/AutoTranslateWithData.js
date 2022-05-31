import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useUserSubscription, useLanguage } from '@rocket.chat/ui-contexts';
import React, { useMemo, useEffect, useState, memo } from 'react';

import { useEndpointActionExperimental } from '../../../../hooks/useEndpointActionExperimental';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import AutoTranslate from './AutoTranslate';

const AutoTranslateWithData = ({ rid }) => {
	const close = useTabBarClose();
	const userLanguage = useLanguage();
	const subscription = useUserSubscription(rid);

	const { value: data } = useEndpointData(
		'autotranslate.getSupportedLanguages',
		useMemo(() => ({ targetLanguage: userLanguage }), [userLanguage]),
	);

	const [currentLanguage, setCurrentLanguage] = useState(subscription.autoTranslateLanguage);

	const saveSettings = useEndpointActionExperimental('POST', 'autotranslate.saveSettings');

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
		if (!subscription.autoTranslate) {
			return;
		}

		if (!subscription.autoTranslateLanguage) {
			handleChangeLanguage(userLanguage);
		}
	}, [subscription.autoTranslate, subscription.autoTranslateLanguage, handleChangeLanguage, userLanguage]);

	return (
		<AutoTranslate
			language={currentLanguage}
			languages={data ? data.languages.map((value) => [value.language, value.name]) : []}
			handleSwitch={handleSwitch}
			handleChangeLanguage={handleChangeLanguage}
			translateEnable={!!subscription.autoTranslate}
			handleClose={close}
		/>
	);
};

export default memo(AutoTranslateWithData);
