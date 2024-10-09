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
		<MessageBody data-qa-type='message-body' dir='auto'>
			<Box display='flex' alignItems='center' fontSize='c2' color='hint'>
				<span
					tabIndex={0}
					role='button'
					onClick={showMessageIgnored}
					onKeyDown={(e) => e.code === 'Enter' && showMessageIgnored(e)}
					style={{ cursor: 'pointer' }}
				>
					<Icon name='chevron-left' /> {t('Message_Ignored')}
				</span>
			</Box>
		</MessageBody>
	);
};

export default memo(IgnoredContent);
