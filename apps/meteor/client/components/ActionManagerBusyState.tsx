import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState } from 'react';

import { useUiKitActionManager } from '../hooks/useUiKitActionManager';

const ActionManagerBusyState = () => {
	const t = useTranslation();
	const actionManager = useUiKitActionManager();
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (!actionManager) {
			return;
		}

		actionManager.on('busy', ({ busy }: { busy: boolean }) => setBusy(busy));

		return () => {
			actionManager.off('busy');
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
