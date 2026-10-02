import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useEmitterValue } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

const ActionManagerBusyState = () => {
	const { t } = useTranslation();
	const actionManager = useUiKitActionManager();
	const busy = useEmitterValue(actionManager, 'busy', () => actionManager.isBusy());

	if (busy) {
		return (
			<Box
				className={css`
					transform: translateX(-50%);
					pointer-events: none;
				`}
				position='absolute'
				insetInlineStart='50%'
				padding={16}
				backgroundColor='tint'
				color='default'
				textAlign='center'
				fontSize='p2'
				elevation='2'
				borderEndStartRadius='medium'
				borderEndEndRadius='medium'
				zIndex={99999}
			>
				{t('Loading')}
			</Box>
		);
	}

	return null;
};

export default ActionManagerBusyState;
