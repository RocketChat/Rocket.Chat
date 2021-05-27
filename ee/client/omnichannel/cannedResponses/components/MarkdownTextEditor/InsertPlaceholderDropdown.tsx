import { Box, Divider } from '@rocket.chat/fuselage';
import React, { FC, memo } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import InsertPlaceholderItem from './InsertPlaceholderItem';

const InsertPlaceholderDropdown: FC = () => {
	const t = useTranslation();

	return (
		<Box>
			<Box textTransform='uppercase' fontScale='c1' fontSize='10px'>
				{t('Contact')}
			</Box>
			<Box is='ul'>
				<InsertPlaceholderItem text={t('Name')} />
				<InsertPlaceholderItem text={t('Email')} />
				<InsertPlaceholderItem text={t('Phone')} />
			</Box>
			<Divider />
			<Box textTransform='uppercase' fontScale='c1' fontSize='10px'>
				{t('Agent')}
			</Box>
			<Box is='ul'>
				<InsertPlaceholderItem text={t('Name')} />
				<InsertPlaceholderItem text={t('Email')} />
			</Box>
		</Box>
	);
};

export default memo(InsertPlaceholderDropdown);
