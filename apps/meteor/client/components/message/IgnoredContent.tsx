import { Box, Icon, MessageBody } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React, { memo } from 'react';

type IgnoredContentProps = {
	onShowButtonClick: () => void;
};

const IgnoredContent = ({ onShowButtonClick }: IgnoredContentProps): ReactElement => {
	const t = useTranslation();

	const handleClick = (event: UIEvent): void => {
		event.stopPropagation();

		onShowButtonClick();
	};

	return (
		<MessageBody data-qa-type='message-body'>
			<Box display='flex' alignItems='center' fontSize='x12' color='hint'>
				<p role='button' onClick={handleClick} style={{ cursor: 'pointer' }}>
					<Icon name='chevron-left' /> {t('Message_Ignored')}
				</p>
			</Box>
		</MessageBody>
	);
};

export default memo(IgnoredContent);
