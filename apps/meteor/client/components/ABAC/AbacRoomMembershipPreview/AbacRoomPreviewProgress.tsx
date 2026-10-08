import type { AbacMembershipGroup } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type ProgressLabels = { done: TranslationKey; soFar: TranslationKey };

const progressLabels: Record<AbacMembershipGroup, { all: ProgressLabels; matching: ProgressLabels }> = {
	loses: {
		all: { done: 'ABAC_Preview_Progress_Removed', soFar: 'ABAC_Preview_Progress_Removed_so_far' },
		matching: { done: 'ABAC_Preview_Progress_Removed_matching', soFar: 'ABAC_Preview_Progress_Removed_matching_so_far' },
	},
	retains: {
		all: { done: 'ABAC_Preview_Progress_Kept', soFar: 'ABAC_Preview_Progress_Kept_so_far' },
		matching: { done: 'ABAC_Preview_Progress_Kept_matching', soFar: 'ABAC_Preview_Progress_Kept_matching_so_far' },
	},
};

type AbacRoomPreviewProgressProps = {
	roomName: string;
	group: AbacMembershipGroup;
	isSearching: boolean;
	found: number;
	checked: number;
	total?: number;
	isChecking: boolean;
	isPartial: boolean;
	isExhausted: boolean;
	onStop: () => void;
};

const AbacRoomPreviewProgress = ({
	roomName,
	group,
	isSearching,
	found,
	checked,
	total,
	isChecking,
	isPartial,
	isExhausted,
	onStop,
}: AbacRoomPreviewProgressProps) => {
	const { t } = useTranslation();
	const labels = progressLabels[group][isSearching ? 'matching' : 'all'];
	const label = isExhausted ? labels.done : labels.soFar;

	return (
		<>
			<Box paddingInline={24} paddingBlock={12}>
				<Box display='flex' alignItems='center' justifyContent='space-between' minHeight='x28'>
					{total === undefined ? (
						<Skeleton width='x160' />
					) : (
						<Box is='span' role='status' fontScale='p2' color='hint'>
							{t(label, { checked, total, count: found, roomName })}
						</Box>
					)}
					{isChecking && (
						<Button small secondary flexShrink={0} marginInlineStart={8} onClick={onStop}>
							{t('ABAC_Preview_Stop')}
						</Button>
					)}
				</Box>
			</Box>
			{isPartial && (
				<Box paddingInline={24} paddingBlockEnd={12}>
					<Callout type='warning'>{t('ABAC_Preview_Partial_warning')}</Callout>
				</Box>
			)}
		</>
	);
};

export default AbacRoomPreviewProgress;
