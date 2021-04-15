import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { memo } from 'react';

import Header from '../../../../components/Header';
import { useBackButton } from '../../../../contexts/BackButtonContext';
import { useTranslation } from '../../../../contexts/TranslationContext';

const BackButton = () => {
	const t = useTranslation();
	const backLabel = t('Back');
	const { backButtonPath, setbackButtonPath } = useBackButton();

	const handleBackClick = useMutableCallback(() => {
		FlowRouter.go(backButtonPath);
		setbackButtonPath('');
	});
	if (!backButtonPath) {
		return null;
	}
	return (
		<Header.State
			title={backLabel}
			icon='arrow-back'
			onClick={handleBackClick}
			color={colors.b500}
			ghost
		/>
	);
};

export default memo(BackButton);
