import { Box, Icon, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import ThreadVerticalBar from './ThreadVerticalBar';

type ThreadErrorProps = {
	reloading?: boolean;
	onReload: () => void;
	onBack: () => void;
	onClose: () => void;
};

const ThreadError = ({ reloading = false, onReload, onBack, onClose }: ThreadErrorProps): ReactElement => {
	const t = useTranslation();

	return (
		<ThreadVerticalBar title={null} onBack={onBack} onClose={onClose}>
			<Box p='x24'>
				<States>
					<StatesIcon name='circle-exclamation' variation='danger' />
					<StatesTitle>{t('Error')}</StatesTitle>
					<StatesSubtitle>{t('Error_something_went_wrong')}</StatesSubtitle>
					<StatesActions>
						<StatesAction disabled={reloading} onClick={onReload}>
							<Icon name='reload' /> {t('Reload')}
						</StatesAction>
					</StatesActions>
				</States>
			</Box>
		</ThreadVerticalBar>
	);
};

export default ThreadError;
