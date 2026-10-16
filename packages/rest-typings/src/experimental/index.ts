import type {
	ISidebarFilter,
	ISidebarFilterRule,
	ISidebarFilterSort,
	ISidebarFiltersDisplay,
	ISubscriptionLabel,
	SubscriptionLabelColor,
	SubscriptionLabelIcon,
} from '@rocket.chat/core-typings';

type SidebarFilterFields = {
	name: string;
	sort: ISidebarFilterSort;
	matches: ISidebarFilterRule;
	notMatches: ISidebarFilterRule;
};

/**
 * Opt-in typings for experimental REST endpoints (`/api/experimental/...`).
 *
 * These are intentionally **not** merged into the `Endpoints` union exported
 * from the package root, so the stable typed client surface (`PathPattern`,
 * `Method`, `Path`, the SDK) stays free of unstable paths. Consumers who want
 * typed experimental calls import `ExperimentalEndpoints` explicitly.
 *
 * Endpoints under this namespace carry **no semver promise**: they may change
 * shape or be removed in any release without a deprecation cycle. See
 * `docs/experimental-api-endpoints.md`.
 *
 * Declare new experimental endpoints here, following the per-resource style of
 * the `/v1` endpoint types (e.g. `v1/calendar`). Every path key must begin with
 * `/experimental/`. For example:
 *
 * ```ts
 * export type ExperimentalEndpoints = {
 * 	'/experimental/example.info': {
 * 		GET: (params: { id: string }) => { id: string; value: number };
 * 	};
 * };
 * ```
 */
export type ExperimentalEndpoints = {
	'/experimental/rooms.setCategory': {
		POST: (params: { roomIds: string[]; category: string | null }) => { success: true };
	};
	'/experimental/subscriptionLabels.create': {
		POST: (params: { name: string; icon?: SubscriptionLabelIcon; color?: SubscriptionLabelColor }) => { label: ISubscriptionLabel };
	};
	'/experimental/subscriptionLabels.update': {
		POST: (params: { labelId: string; name?: string; icon?: SubscriptionLabelIcon; color?: SubscriptionLabelColor }) => {
			label: ISubscriptionLabel;
		};
	};
	'/experimental/subscriptionLabels.delete': {
		POST: (params: { labelId: string }) => { success: true };
	};
	'/experimental/sidebarFilters.create': {
		POST: (params: SidebarFilterFields) => { filter: ISidebarFilter };
	};
	'/experimental/sidebarFilters.update': {
		POST: (params: SidebarFilterFields & { filterId: string }) => { filter: ISidebarFilter };
	};
	'/experimental/sidebarFilters.delete': {
		POST: (params: { filterId: string }) => { success: true };
	};
	'/experimental/sidebarFilters.duplicate': {
		POST: (params: { filterId: string; name: string }) => { filter: ISidebarFilter };
	};
	'/experimental/sidebarFilters.reorder': {
		POST: (params: { filterIds: string[] }) => { success: true };
	};
	'/experimental/sidebarFilters.setDisplayPreferences': {
		POST: (params: Partial<ISidebarFiltersDisplay>) => { success: true };
	};
	'/experimental/subscriptions.setLabels': {
		POST: (params: { roomId: string; labelIds: string[] }) => { success: true };
	};
	'/experimental/subscriptions.readMany': {
		POST: (params: { roomIds: string[] }) => { success: true };
	};
};
