import { Box, Button, Callout, Margins, ProgressBar, ToggleSwitch } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';

const CustomUserStatusService = ({ connections }: { connections: { current: number; max: number } | undefined }) => {
	const t = useTranslation();

	if (!connections) {
		return null;
	}

	const { current, max } = connections;
	const percentage = (current / max) * 100;

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
						<Box>
							{current}/{max}
						</Box>
					</Box>
					<ProgressBar percentage={percentage} variant='success' />
					{percentage >= 100 && (
						<Margins block='x16'>
							<Callout type='danger' title={t('Service_disabled')}>
								{t('Service_disabled_description')}
							</Callout>
						</Margins>
					)}
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
				<Button primary width='100%'>
					{t('More_about_Enterprise_Edition')}
				</Button>
			</VerticalBar.Footer>
		</>
	);
};

export default CustomUserStatusService;
