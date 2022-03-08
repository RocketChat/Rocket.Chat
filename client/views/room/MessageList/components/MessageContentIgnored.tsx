/* eslint-disable complexity */
import { Box, Icon, MessageBody } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

const MessageContentIgnored: FC<{ onShowMessageIgnored: () => void }> = ({ onShowMessageIgnored }) => {
	const t = useTranslation();

	return (
		<MessageBody>
			<Box display='flex' alignItems='center' fontSize='x12' color='hint'>
				<p role='button' onClick={(): void => onShowMessageIgnored()} style={{ cursor: 'pointer' }}>
					<Icon name='chevron-left' /> {t('Message_Ignored')}
				</p>
			</Box>
		</MessageBody>
	);
};

export default memo(MessageContentIgnored);
