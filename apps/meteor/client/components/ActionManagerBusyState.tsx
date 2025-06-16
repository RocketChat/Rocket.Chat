import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUiKitActionManager } from '../uikit/hooks/useUiKitActionManager';

const ActionManagerBusyState = () => {
	const { t } = useTranslation();
	const actionManager = useUiKitActionManager();
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!actionManager) {
			return;
		}

		const handleBusyStateChange = ({ busy }: { busy: boolean }) => setBusy(busy);

		actionManager.on('busy', handleBusyStateChange);

		return () => {
			actionManager.off('busy', handleBusyStateChange);
		};
	}, [actionManager]);

	if (busy) {
		return (
			<Box
				className={css`
					transform: translateX(-50%);
					pointer-events: none;
				`}
				position='absolute'
				insetInlineStart='50%'
				p={16}
				bg='tint'
				color='default'
				textAlign='center'
				fontSize='p2'
				elevation='2'
				borderRadius='0 0 4px 4px'
				zIndex={99999}
			>
				{t('Loading')}
			</Box>
		);
	}

	return null;
};

export default ActionManagerBusyState;
