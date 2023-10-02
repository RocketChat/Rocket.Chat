import { Box, Button, Icon, Tag } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import type { ILicenseV3 } from '@rocket.chat/license';
import { Card, CardBody, CardColSection, ExternalLink } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useIsSelfHosted } from '../../../../../hooks/useIsSelfHosted';
import { getDaysLeft } from '../../../../../lib/utils/getDaysLeft';

type PlanCardProps = {
	isEnterprise: boolean;
	license: ILicenseV3;
};

const PlanCard = ({ isEnterprise, license }: PlanCardProps): ReactElement => {
	const { t } = useTranslation();
	const isSelfHosted = useIsSelfHosted();
	const formatDate = useFormatDate();

	const planName = isEnterprise ? license?.information?.tags && license.information?.tags[0]?.name : t('Community');
	const isSalesAssisted = license?.information?.grantedBy?.method !== 'self-service' || true;
	const isTrial = license?.information?.trial || false;
	const isAutoRenew = license?.information?.autoRenew || false;
	const visualExpiration = license?.information?.visualExpiration;
	const trialDaysLeft = (isTrial && getDaysLeft(visualExpiration)) || 0;

	const getPlanContent = (): ReactNode => {
		if (isTrial) {
			return (
				<Box display='flex' flexDirection='column' h='full'>
					<Box fontScale='p2b' mb={6} display='flex'>
						<Box mie={8}>{t('Trial_period_active')}</Box> <Tag>{t('n_days_left', { n: trialDaysLeft })}</Tag>
					</Box>
					<Box fontScale='p2' mb={6}>
						{isSalesAssisted ? (
							<Trans i18nKey='Contact_sales_trial'>
								Contact sales to finish your purchase and avoid
								<ExternalLink to='https://go.rocket.chat/i/downgrade'>downgrade consequences.</ExternalLink>
							</Trans>
						) : (
							<Trans i18nKey='Finish_your_purchase_trial'>
								Finish your purchase to avoid <ExternalLink to='https://go.rocket.chat/i/downgrade'>downgrade consequences.</ExternalLink>
							</Trans>
						)}
					</Box>
					<Box fontScale='p2' mb={6}>
						<Trans i18nKey='Why_has_a_trial_been_applied_to_this_workspace'>
							<ExternalLink to='https://go.rocket.chat/i/downgrade'>Why has a trial been applied to this workspace?</ExternalLink>
						</Trans>
					</Box>
					<Button mbs='auto' primary w='full' is='a' href='https://go.rocket.chat/i/purchase' target='_blank' rel='noopener noreferrer'>
						{isSalesAssisted ? t('Contact_sales') : t('Finish_purchase')}
					</Button>
				</Box>
			);
		}

		if (!isEnterprise) {
			return (
				<>
					<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
						<Icon name='card' size={24} mie={12} /> {t('free_per_month_user')}
					</Box>
					<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
						<Icon name='cloud-plus' size={24} mie={12} /> {t('Self_managed_hosting')}
					</Box>
				</>
			);
		}

		return (
			<>
				<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
					<Icon name='calendar' size={24} mie={12} />
					<Box is='span'>
						{isAutoRenew ? (
							t('Renews_DATE', { date: formatDate(visualExpiration) })
						) : (
							<Trans i18nKey='Contact_sales_renew_date'>
								<ExternalLink to='https://go.rocket.chat/i/downgrade'>Contact sales</ExternalLink> to check plan renew date.
							</Trans>
						)}
					</Box>
				</Box>
				<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
					<Icon name='cloud-plus' size={24} mie={12} /> {isSelfHosted ? t('Self_managed_hosting') : t('Cloud_hosting')}
				</Box>
			</>
		);
	};

	return (
		<Card>
			<CardBody flexDirection='column' mb={0}>
				<CardColSection display='flex' alignItems='center'>
					<Icon name='rocketchat' color={colors.r500} size={28} mie={4} />
					<Box fontScale='h3'>{planName}</Box>
				</CardColSection>
				<CardColSection display='flex' flexDirection='column' h='full'>
					{getPlanContent()}
				</CardColSection>
			</CardBody>
		</Card>
	);
};

export default PlanCard;
