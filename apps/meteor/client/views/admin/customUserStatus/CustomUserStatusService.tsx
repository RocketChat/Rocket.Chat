import {
	Box,
	Button,
	ButtonGroup,
	Callout,
	Margins,
	ProgressBar,
	Skeleton,
	StatesAction,
	StatesIcon,
	StatesSubtitle,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { useEndpoint, useSetting } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';

import { ContextualbarContent, ContextualbarFooter } from '../../../components/Contextualbar';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useActiveConnections } from '../../hooks/useActiveConnections';

const CustomUserStatusService = () => {
	const { t } = useTranslation();
	const result = useActiveConnections();
	const presenceDisabled = useSetting('Presence_broadcast_disabled', false);
	const togglePresenceServiceEndpoint = useEndpoint('POST', '/v1/presence.enableBroadcast');
	const disablePresenceService = useMutation({
		mutationFn: () => togglePresenceServiceEndpoint(),
	});
	const { data: license, isPending: licenseIsLoading } = useIsEnterprise();

	if (result.isPending || disablePresenceService.isPending || licenseIsLoading) {
		return (
			<Box pi={16} pb={8}>
				<Skeleton />
				<Skeleton />
				<Skeleton />
				<Skeleton />
				<Skeleton />
			</Box>
		);
	}
	if (result.isError || disablePresenceService.isError) {
		return (
			<Box display='flex' flexDirection='column' alignItems='center' pb={20} color='default'>
				<StatesIcon name='circle-exclamation' />
				<StatesSubtitle>{t('Unable_to_load_active_connections')}</StatesSubtitle>
				<StatesAction icon='reload' onClick={() => result.refetch()}>
					{t('Retry')}
				</StatesAction>
			</Box>
		);
	}

	const { current, max, percentage } = result.data;

	return (
		<>
			<ContextualbarContent display='flex' flexDirection='column' justifyContent='space-between' color='default'>
				<div>
					<Box display='flex' justifyContent='space-between' mb={16}>
						<Box fontScale='p1'>{t('Service_status')}</Box>
						<ToggleSwitch
							disabled={disablePresenceService.isPending || !presenceDisabled || percentage === 100}
							checked={!presenceDisabled}
							onChange={() => disablePresenceService.mutate()}
						/>
					</Box>
					<Box display='flex' fontScale='c1' justifyContent='space-between' mb={16}>
						<Box>{t('Active_connections')}</Box>
						<Box>{license?.isEnterprise ? current : `${current}/${max}`}</Box>
					</Box>
					{!license?.isEnterprise && <ProgressBar percentage={percentage} variant={percentage > 80 ? 'danger' : 'success'} />}
					{presenceDisabled && (
						<Margins block={16}>
							<Callout type='danger' title={t('Service_disabled')}>
								{t('Service_disabled_description')}
							</Callout>
						</Margins>
					)}
				</div>
				<Box display='flex' flexDirection='column' mb={16}>
					{license?.isEnterprise ? (
						<>
							<Box fontScale='p2' mb={8}>
								{t('Premium_cap_description')}
							</Box>
							<Box fontScale='p2' mb={8}>
								<Trans i18nKey='Larger_amounts_of_active_connections'>
									For larger amounts of active connections you can consider our
									<Box is='a' href='https://docs.rocket.chat/deploy/scaling-rocket.chat' target='_blank' color='info'>
										multiple instance solutions
									</Box>
									.
								</Trans>
							</Box>
						</>
					) : (
						<>
							<Box fontScale='p2' mb={8}>
								{t('Community_cap_description')}
							</Box>
							<Box fontScale='p2' mb={8}>
								{t('Premium_cap_description')}
							</Box>
						</>
					)}
				</Box>
			</ContextualbarContent>
			{!license?.isEnterprise && (
				<ContextualbarFooter borderBlockStartWidth='default' borderBlockColor='extra-light'>
					<ButtonGroup stretch vertical>
						<Button primary width='100%' is='a' href='https://www.rocket.chat/enterprise' target='_blank'>
							{t('More_about_Premium_plans')}
						</Button>
					</ButtonGroup>
				</ContextualbarFooter>
			)}
		</>
	);
};

export default CustomUserStatusService;
