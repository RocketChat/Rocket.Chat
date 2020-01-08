import { Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';
import styled from 'styled-components';

import { useTranslation } from '../../../contexts/TranslationContext';

// TODO: get rid of it
const StyledResetSettingButton = styled(Button)`
	padding-block: 0 !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
`;

export function ResetSettingButton(props) {
	const t = useTranslation();

	return <StyledResetSettingButton
		aria-label={t('Reset')}
		danger
		ghost
		small
		title={t('Reset')}
		{...props}
	>
		<Icon name='undo' />
	</StyledResetSettingButton>;
}
