import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import CallToolBox from './CallToolBox';

const Header: FC<{ calls: number; state: string; buttonList: Array<ReactNode> }> = ({
	calls,
	state,
	buttonList,
}) => {
	const t = useTranslation();
	const compactHeaderStates = ['incoming', 'current'];
	return (
		<Box>
			{compactHeaderStates.includes(state) && (
				<Box mbe={8} textAlign='center' color='surface'>
					{calls} {t('Calls_in_queue', calls)}
				</Box>
			)}
			<CallToolBox state={state} buttonList={buttonList} />
			{!compactHeaderStates.includes(state) && (
				<Box
					mbs={18}
					display='flex'
					justifyContent='space-between'
					alignItems='center'
					color='surface'
					lineHeight={20}
				>
					<Box fontSize={14}>
						<Icon color='info' size={24} name='phone-in' />
						{t('Calls_in_queue')}
					</Box>
					<Box fontSize={22}>{calls}</Box>
				</Box>
			)}
		</Box>
	);
};

export default Header;
