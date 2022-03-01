import { Box, Banner, Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { e2e } from '../../../../app/e2e/client/rocketchat.e2e';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const E2ERoomBanner: FC<any> = ({ e2eRoom }) => {
	const t = useTranslation();
	const router = useRoute('account');

	const handleEnterKey = (): void => {
		e2e.decodePrivateKey(e2e.db_private_key, true);
	};

	const handleForgotKey = (): void => {
		router.push({ group: 'security' });
	};

	if (!e2eRoom) return null;

	return (
		<Banner icon={<Icon name='key' size={24} />} title={t('Enter_Encryption_Key_To_View_Messages')} variant='warning'>
			<Box withTruncatedText>
				{t('See_encrypted_messages_using_key')}{' '}
				<Box is='span' onClick={handleEnterKey} textDecorationLine='underline'>
					{t('Enter_Key')}
				</Box>{' '}
				<Box is='span' onClick={handleForgotKey} textDecorationLine='underline'>
					{t('I_Forgot_My_Key')}
				</Box>
			</Box>
		</Banner>
	);
};

export default E2ERoomBanner;
