import { Badge } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { defaultFeaturesPreview, usePreferenceFeaturePreviewList } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCanScheduleMessages } from '../../../../hooks/useCanScheduleMessages';
import { useScheduledMessages } from '../../../../hooks/useScheduledMessages';

export const useAccountItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const router = useRouter();

	const { unseenFeatures, featurePreviewEnabled } = usePreferenceFeaturePreviewList();
	const canSchedule = useCanScheduleMessages();
	const { data: scheduledMessages = [] } = useScheduledMessages(undefined, { enabled: canSchedule });
	const failedCount = scheduledMessages.filter(({ status }) => status === 'failed').length;

	const handleMyAccount = useStableCallback(() => {
		router.navigate('/account');
	});
	const handlePreferences = useStableCallback(() => {
		router.navigate('/account/preferences');
	});
	const handleFeaturePreview = useStableCallback(() => {
		router.navigate('/account/feature-preview');
	});
	const handleAccessibility = useStableCallback(() => {
		router.navigate('/account/accessibility-and-appearance');
	});
	const handleScheduledMessages = useStableCallback(() => {
		router.navigate('/scheduled-messages');
	});

	const featurePreviewItem = {
		id: 'feature-preview',
		icon: 'flask' as const,
		content: t('Feature_preview'),
		onClick: handleFeaturePreview,
		...(unseenFeatures > 0 && {
			addon: (
				<Badge variant='primary' aria-label={t('Unseen_features')}>
					{unseenFeatures}
				</Badge>
			),
		}),
	};

	return [
		{
			id: 'profile',
			icon: 'user',
			content: t('Profile'),
			onClick: handleMyAccount,
		},
		{
			id: 'preferences',
			icon: 'customize',
			content: t('Preferences'),
			onClick: handlePreferences,
		},
		...(canSchedule
			? [
					{
						id: 'scheduled-messages',
						icon: 'clock' as const,
						content: t('Scheduled_messages'),
						onClick: handleScheduledMessages,
						...(failedCount > 0 && {
							addon: (
								<Badge variant='danger' aria-label={t('Scheduled_messages_failed', { count: failedCount })}>
									{failedCount}
								</Badge>
							),
						}),
					},
				]
			: []),
		{
			id: 'accessibility',
			icon: 'person-arms-spread',
			content: t('Accessibility_and_Appearance'),
			onClick: handleAccessibility,
		},
		...(featurePreviewEnabled && defaultFeaturesPreview.length > 0 ? [featurePreviewItem] : []),
	];
};
