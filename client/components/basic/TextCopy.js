import React, { useCallback } from 'react';
import { Box, Icon, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const TextCopy = ({ text, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const onClick = useCallback(() => {
		try {
			navigator.clipboard.writeText(text);
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	}, [dispatchToastMessage, t, text]);

	return <Box
		display='flex'
		flexDirection='row'
		justifyContent='stretch'
		alignItems='flex-start'
		flexGrow={1}
		{...props}
	>
		<Box
			fontFamily='mono'
			alignSelf='center'
			fontScale='p1'
			style={{ wordBreak: 'break-all' }}
			mie='x4'
		>
			{text}
		</Box>
		<Button ghost small onClick={onClick} title={t('Copy')}>
			<Icon name='copy' size='x20' />
		</Button>
	</Box>;
};

export default TextCopy;
