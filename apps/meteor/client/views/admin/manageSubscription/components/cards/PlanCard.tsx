import { Box, Button, Icon, Palette, Skeleton, Tag } from '@rocket.chat/fuselage';
import type { ILicenseV3 } from '@rocket.chat/license';
import { Card, CardBody, CardColSection, ExternalLink } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useFormatDate } from '../../../../../hooks/useFormatDate';
import { useIsSelfHosted } from '../../../../../hooks/useIsSelfHosted';
import { getDaysLeft } from '../../../../../lib/utils/getDaysLeft';
import { CONTACT_SALES_LINK, DOWNGRADE_LINK, TRIAL_LINK } from '../../utils/links';
import UpgradeButton from '../UpgradeButton';

type PlanCardProps = {
	isEnterprise: boolean;
	license: ILicenseV3 | undefined;
};

const PlanCard = ({ isEnterprise, license }: PlanCardProps): ReactElement => {
	const { t } = useTranslation();
	const { isSelfHosted, isLoading } = useIsSelfHosted();
	const formatDate = useFormatDate();

	const planName = isEnterprise ? license?.information?.tags && license.information?.tags[0]?.name : 'Community';
	const isSalesAssisted = license?.information?.grantedBy?.method !== 'self-service' || true;
	const isTrial = license?.information?.trial || false;
	const isAutoRenew = license?.information?.autoRenew || false;
	const visualExpiration = license?.information?.visualExpiration || String(new Date());
	const trialDaysLeft = (isTrial && getDaysLeft(visualExpiration)) || 0;

	const getPlanContent = (): ReactNode => {
		if (isTrial) {
			return (
				<Box display='flex' flexDirection='column' h='full'>
					<Box fontScale='p2b' mb={6} display='flex'>
						<Box mie={8}>{t('Trial_active')}</Box> <Tag>{t('n_days_left', { n: trialDaysLeft })}</Tag>
					</Box>
					<Box fontScale='p2' mb={6}>
						{isSalesAssisted ? (
							<Trans i18nKey='Contact_sales_trial'>
								Contact sales to finish your purchase and avoid
								<ExternalLink to={DOWNGRADE_LINK}>downgrade consequences.</ExternalLink>
							</Trans>
						) : (
							<Trans i18nKey='Finish_your_purchase_trial'>
								Finish your purchase to avoid <ExternalLink to={DOWNGRADE_LINK}>downgrade consequences.</ExternalLink>
							</Trans>
						)}
					</Box>
					<Box fontScale='p2' mb={6}>
						<Trans i18nKey='Why_has_a_trial_been_applied_to_this_workspace'>
							<ExternalLink to={TRIAL_LINK}>Why has a trial been applied to this workspace?</ExternalLink>
						</Trans>
					</Box>
					{isSalesAssisted ? (
						<Button mbs='auto' primary w='full' is='a' href={CONTACT_SALES_LINK} external>
							{t('Contact_sales')}
						</Button>
					) : (
						<UpgradeButton i18nKey='Finish_purchase' primary mbs='auto' w='full' />
					)}
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
								<ExternalLink to={CONTACT_SALES_LINK}>Contact sales</ExternalLink> to check plan renew date.
							</Trans>
						)}
					</Box>
				</Box>
				{!isLoading ? (
					<Box fontScale='p2' display='flex' mb={4} alignItems='center'>
						<Icon name='cloud-plus' size={24} mie={12} /> {isSelfHosted ? t('Self_managed_hosting') : t('Cloud_hosting')}
					</Box>
				) : (
					<Skeleton />
				)}
			</>
		);
	};

	return (
		<Card>
			<CardBody flexDirection='column' mb={0}>
				<CardColSection display='flex' alignItems='center'>
					<Icon name='rocketchat' color={Palette.badge['badge-background-level-4'].toString()} size={28} mie={4} />
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
