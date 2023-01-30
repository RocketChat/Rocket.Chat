import { Box, Button, ProgressBar, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';

const CustomUserStatusService = () => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Content display='flex' flexDirection='column' justifyContent='space-between' color='default'>
				<div>
					<Box display='flex' justifyContent='space-between' mb='x16'>
						<Box fontScale='p1'>{t('Service_status')}</Box>
						<ToggleSwitch />
					</Box>
					<Box display='flex' fontScale='c1' justifyContent='space-between' mb='x16'>
						<Box>{t('Active_connections')}</Box>
						<Box>100/200</Box>
					</Box>
					<ProgressBar percentage={50} variant='success' />
				</div>
				<Box display='flex' flexDirection='column' alignItems='center' mb='x16'>
					<Box fontScale='p2' mb='x8'>
						{t('Community_cap_description')}
					</Box>
					<Box fontScale='p2' mb='x8'>
						{t('Enterprise_cap_description')}
					</Box>
				</Box>
			</VerticalBar.Content>
			<VerticalBar.Footer borderBlockStartWidth='default' borderBlockColor='extra-light'>
				<Button primary>{t('More_about_Enterprise_Edition')}</Button>
			</VerticalBar.Footer>
		</>
	);
};

export default CustomUserStatusService;
