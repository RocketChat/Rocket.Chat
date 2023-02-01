import {
	Box,
	Button,
	ButtonGroup,
	Callout,
	Icon,
	Margins,
	ProgressBar,
	Skeleton,
	StatesAction,
	StatesIcon,
	StatesSubtitle,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { useEndpoint, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useActiveConnections } from './hooks/useActiveConnections';

const CustomUserStatusService = () => {
	const t = useTranslation();
	const result = useActiveConnections();
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');
	const togglePresenceServiceEndpoint = useEndpoint('POST', '/v1/presence.enableBroadcast');
	const disablePresenceService = useMutation(() => togglePresenceServiceEndpoint());

	if (result.isLoading || disablePresenceService.isLoading) {
		return <Skeleton />;
	}
	if (result.isError || disablePresenceService.isError) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' pb='x20' color='default'>
				<StatesIcon name='circle-exclamation' />
				<StatesSubtitle>Unable to load active connections</StatesSubtitle>
				<StatesAction onClick={() => result.refetch()}>
					<Icon name='reload' /> Retry
				</StatesAction>
			</Box>
		);
	}

	const { current, max, percentage } = result.data;

	return (
		<>
			<VerticalBar.Content display='flex' flexDirection='column' justifyContent='space-between' color='default'>
				<div>
					<Box display='flex' justifyContent='space-between' mb='x16'>
						<Box fontScale='p1'>{t('Service_status')}</Box>
						<ToggleSwitch
							disabled={disablePresenceService.isLoading || !presenceDisabled || percentage === 100}
							checked={!presenceDisabled}
							onClick={
								!(disablePresenceService.isLoading || !presenceDisabled || percentage === 100)
									? () => disablePresenceService.mutate()
									: undefined
							}
						/>
					</Box>
					<Box display='flex' fontScale='c1' justifyContent='space-between' mb='x16'>
						<Box>{t('Active_connections')}</Box>
						<Box>
							{current}/{max}
						</Box>
					</Box>
					<ProgressBar percentage={percentage} variant='success' />
					{presenceDisabled && (
						<Margins block='x16'>
							<Callout type='danger' title={t('Service_disabled')}>
								{t('Service_disabled_description')}
							</Callout>
						</Margins>
					)}
				</div>
				<Box display='flex' flexDirection='column' mb='x16'>
					<Box fontScale='p2' mb='x8'>
						{t('Community_cap_description')}
					</Box>
					<Box fontScale='p2' mb='x8'>
						{t('Enterprise_cap_description')}
					</Box>
				</Box>
			</VerticalBar.Content>
			<VerticalBar.Footer borderBlockStartWidth='default' borderBlockColor='extra-light'>
				<ButtonGroup stretch vertical>
					<Button primary width='100%'>
						{t('More_about_Enterprise_Edition')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default CustomUserStatusService;
