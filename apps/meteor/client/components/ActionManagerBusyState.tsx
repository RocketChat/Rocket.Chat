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
			<Box display='flex' position='fixed' zIndex={99999} justifyContent='center' w='100vw'>
				<Box bg='tint' p={16} fontSize='p2' elevation='2' borderRadius='0 0 4px 4px'>
					{t('Loading')}
				</Box>
			</Box>
		);
	}

	return null;
};

export default ActionManagerBusyState;
