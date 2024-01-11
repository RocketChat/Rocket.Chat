import { Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const ReadOnlyComposerHint = (): ReactElement => {
	const t = useTranslation();
	return (
		<>
			<Tooltip variation='light' fontScale='c2'>
				{t('This_room_is_read_only')}
			</Tooltip>
		</>
	);
};

export default ReadOnlyComposerHint;
