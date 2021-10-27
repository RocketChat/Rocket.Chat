import { Box } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import CallToolBox from './CallToolBox';

const Header: FC<{ calls: number; state: string; buttonList: Array<ReactNode> }> = ({
	calls,
	state,
	buttonList,
}) => {
	const t = useTranslation();
	return (
		<Box>
			<Box mbe={8} textAlign='center' color='surface'>
				{calls} {t('Calls in Queue' as 'strike')}
				{/* {t('calls_in_queue', calls)} */}
			</Box>
			<CallToolBox state={state} buttonList={buttonList} />
		</Box>
	);
};

export default Header;
