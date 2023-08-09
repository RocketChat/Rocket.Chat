import { Box, Icon, MessageBody } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

type IgnoredContentProps = {
	onShowMessageIgnored: () => void;
};

const IgnoredContent = ({ onShowMessageIgnored }: IgnoredContentProps): ReactElement => {
	const t = useTranslation();

	const showMessageIgnored = (event: React.SyntheticEvent): void => {
		event.stopPropagation();

		onShowMessageIgnored();
	};

	return (
		<MessageBody data-qa-type='message-body'>
			<Box display='flex' alignItems='center' fontSize='c2' color='hint'>
				<p role='button' onClick={showMessageIgnored} style={{ cursor: 'pointer' }}>
					<Icon name='chevron-left' /> {t('Message_Ignored')}
				</p>
			</Box>
		</MessageBody>
	);
};

export default memo(IgnoredContent);
