/* eslint-disable complexity */
import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

const MessageContentIgnored: FC<{ onShowMessageIgnored: () => void }> = ({ onShowMessageIgnored }) => {
	const t = useTranslation();

	const showMessageIgnored = (event: React.SyntheticEvent): void => {
		event.stopPropagation();

		onShowMessageIgnored();
	};

	return (
		<Box display='flex' alignItems='center' fontSize='x12' color='hint'>
			<p role='button' onClick={showMessageIgnored} style={{ cursor: 'pointer' }}>
				<Icon name='chevron-left' /> {t('Message_Ignored')}
			</p>
		</Box>
	);
};

export default memo(MessageContentIgnored);
