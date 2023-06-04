import { Tile } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const DisplayEmptyDataMessage = (): ReactElement => {
	const t = useTranslation();

	return (
		<Tile fontScale='p2' elevation='0' color='hint' textAlign='center'>
			{t('No_data_found')}
		</Tile>
	);
};

export default DisplayEmptyDataMessage;
