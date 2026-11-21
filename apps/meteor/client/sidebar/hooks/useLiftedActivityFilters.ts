import { useCallback, useState } from 'react';

/** The groups whose activity filter is lifted for this session, each with the window it was lifted at. */
export type LiftedActivityFilters = Readonly<Record<string, number>>;

/**
 * Lifting a group's activity filter from its chip lasts for this session only, and only for the window it was
 * lifted at: a lift is dropped as soon as another window is chosen, so the new one applies right away and the
 * old one applies again if it is ever chosen back.
 */
export const useLiftedActivityFilters = () => {
	const [liftedFilters, setLiftedFilters] = useState<LiftedActivityFilters>({});

	const toggleLifted = useCallback(
		(groupKey: string, activityFilterHours: number) =>
			setLiftedFilters(({ [groupKey]: lifted, ...others }) =>
				lifted === activityFilterHours ? others : { ...others, [groupKey]: activityFilterHours },
			),
		[],
	);

	const dropLifted = useCallback(
		(groupKey: string) =>
			setLiftedFilters((filters) => {
				if (!(groupKey in filters)) {
					return filters;
				}
				const { [groupKey]: _dropped, ...others } = filters;
				return others;
			}),
		[],
	);

	return { liftedFilters, toggleLifted, dropLifted };
};
