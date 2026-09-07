import type { AbacMembershipPreview } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';

import { ABACQueryKeys } from '../../../lib/queryKeys';

export type AbacMembershipPreviewTarget = { rid: string } | { memberIds: string[] } | { memberUsernames: string[] };

export type UseAbacMembershipPreviewOptions = {
	target: AbacMembershipPreviewTarget;
	/** Attribute key → selected values. */
	attributes: Record<string, string[]>;
	offset?: number;
	count?: number;
	enabled?: boolean;
};

/**
 * Reads the membership-impact preview (ABAC-P4 §7.2) for a target and a candidate attribute set.
 *
 * One hook for all three surfaces — creation Step 4, the room Edit-channel preview and the admin
 * Edit-room preview — so none of them can compute impact differently from the others. It never
 * commits: the endpoint behind it is a dry run.
 */
export const useAbacMembershipPreview = ({ target, attributes, offset = 0, count, enabled = true }: UseAbacMembershipPreviewOptions) => {
	const previewMembership = useEndpoint('POST', '/v1/abac/membership-preview');

	const rid = 'rid' in target ? target.rid : undefined;
	const memberIds = 'memberIds' in target ? target.memberIds : undefined;
	const memberUsernames = 'memberUsernames' in target ? target.memberUsernames : undefined;

	// An empty attribute set restricts nobody, and an empty member list has nothing to evaluate;
	// neither is worth a round trip.
	const hasTarget = Boolean(rid) || Boolean(memberIds?.length) || Boolean(memberUsernames?.length);
	const isEnabled = enabled && Object.keys(attributes).length > 0 && hasTarget;

	const query = useQuery<AbacMembershipPreview>({
		queryKey: ABACQueryKeys.membershipPreview({ rid, memberIds, memberUsernames, attributes, offset, count }),
		enabled: isEnabled,
		// The impact of a given attribute set does not drift on its own, and this is a PDP fan-out —
		// so it is not refetched on focus.
		refetchOnWindowFocus: false,
		staleTime: 30_000,
		queryFn: () => {
			const targetParams = (() => {
				if (rid) {
					return { rid };
				}
				if (memberUsernames) {
					return { memberUsernames };
				}
				return { memberIds: memberIds ?? [] };
			})();

			return previewMembership({
				...targetParams,
				attributes,
				offset,
				...(count !== undefined && { count }),
			});
		},
	});

	return {
		...query,
		// A disabled query stays `pending` for as long as it is disabled, and every surface here
		// renders pending as a skeleton — so a flow that reaches the preview with nothing to
		// evaluate would sit on a loading state that never resolves (ABAC-P4 QA).
		isPending: isEnabled && query.isPending,
		/** Nothing was asked of the server: no target, or no attributes chosen. */
		isSkipped: !isEnabled,
	};
};
