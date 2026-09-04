import type { AbacMembershipPreview as AbacMembershipPreviewData } from '@rocket.chat/core-typings';
import { Box, Callout, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import AbacPreviewMemberGroup from './AbacPreviewMemberGroup';

export type AbacMembershipPreviewVariant =
	/** Creation Step 4: members are grouped as Compliant / Non-compliant. */
	| 'compliance'
	/** Editing an existing room: members are grouped as Retains access / Loses access. */
	| 'impact';

export type AbacMembershipPreviewProps = {
	variant: AbacMembershipPreviewVariant;
	data?: AbacMembershipPreviewData;
	isPending?: boolean;
	error?: unknown;
};

/**
 * The membership-impact preview (ABAC-P4 §7.2, Figma 5392:50846 and 3505:5274).
 *
 * Built once and rendered by creation Step 4, the room Edit-channel preview and the admin
 * Edit-room preview. `variant` changes only the group headings and which callout leads — the data,
 * the counts and the ordering are identical, because they come from one server-side evaluation.
 */
const AbacMembershipPreview = ({ variant, data, isPending, error }: AbacMembershipPreviewProps) => {
	const { t } = useTranslation();

	if (isPending) {
		return (
			<Box>
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} marginBlockEnd={8} />
				))}
			</Box>
		);
	}

	if (error) {
		// A PDP failure must never render as "nobody is affected" — say the impact is unknown.
		return <Callout type='danger'>{t('ABAC_Membership_impact_unavailable')}</Callout>;
	}

	if (!data) {
		return null;
	}

	const { loses, retains, inconclusive, counts, summarisedOnly, actorLosesAccess } = data;

	const removedTitle = variant === 'compliance' ? t('ABAC_Non_compliant') : t('ABAC_Loses_access');
	const keptTitle = variant === 'compliance' ? t('ABAC_Compliant') : t('ABAC_Retains_access');

	const allRemoved = counts.losing > 0 && counts.losing === counts.total;

	return (
		<Box>
			{variant === 'compliance' && (
				<Callout icon='info-circled' marginBlockEnd={16}>
					{t('ABAC_Only_compliant_users_can_be_added')}
				</Callout>
			)}

			{variant === 'impact' && counts.losing === 0 && (
				<Callout icon='info-circled' marginBlockEnd={16}>
					{t('ABAC_No_members_will_be_removed')}
				</Callout>
			)}

			{variant === 'impact' && allRemoved && (
				<Callout type='danger' marginBlockEnd={16} title={t('ABAC_All_members_will_be_removed')}>
					{t('ABAC_Empty_room_repopulation_warning')}
				</Callout>
			)}

			{variant === 'impact' && counts.losing > 0 && !allRemoved && (
				<Callout icon='info-circled' marginBlockEnd={16}>
					{t('ABAC_N_of_M_members_will_be_removed', { count: counts.losing, total: counts.total })}
				</Callout>
			)}

			{/* ABAC-P4/D2 — an editor may commit a change that removes their own access, but must be
			    told before they do. */}
			{actorLosesAccess && (
				<Callout type='warning' marginBlockEnd={16}>
					{t('ABAC_You_will_lose_access')}
				</Callout>
			)}

			{counts.inconclusive > 0 && (
				<Callout type='warning' marginBlockEnd={16}>
					{t('ABAC_Impact_unknown_for_n_members', { count: counts.inconclusive })}
				</Callout>
			)}

			{summarisedOnly ? (
				// Above the enumeration threshold the counts are exact but the list is not rendered.
				<Box fontScale='p2' color='hint'>
					{t('ABAC_Preview_summarised', { total: counts.total })}
				</Box>
			) : (
				<>
					<Box fontScale='p2' color='hint' marginBlockEnd={12}>
						{t('ABAC_Showing_n_of_m', { count: loses.length + retains.length + inconclusive.length, total: counts.total })}
					</Box>

					{retains.length > 0 && <AbacPreviewMemberGroup title={keptTitle} count={counts.retaining} members={retains} />}
					{loses.length > 0 && <AbacPreviewMemberGroup title={removedTitle} count={counts.losing} members={loses} />}
					{inconclusive.length > 0 && (
						<AbacPreviewMemberGroup title={t('ABAC_Impact_unknown')} count={counts.inconclusive} members={inconclusive} />
					)}
				</>
			)}
		</Box>
	);
};

export default AbacMembershipPreview;
