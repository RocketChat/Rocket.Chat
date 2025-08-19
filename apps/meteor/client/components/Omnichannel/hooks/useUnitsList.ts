import type { IOmnichannelBusinessUnit, Serialized } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

type UnitsListOptions = {
	filter: string;
	haveNone?: boolean;
	limit?: number;
};

export type UnitOption = {
	_id: string;
	value: string;
	label: string;
};

const DEFAULT_QUERY_LIMIT = 25;

export const useUnitsList = (options: UnitsListOptions) => {
	const { t } = useTranslation();
	const { haveNone = false, filter, limit = DEFAULT_QUERY_LIMIT } = options;
	const getUnits = useEndpoint('GET', '/v1/livechat/units');

	const formatUnitItem = (u: Serialized<IOmnichannelBusinessUnit>): UnitOption => ({
		_id: u._id,
		label: u.name,
		value: u._id,
	});

	return useInfiniteQuery({
		queryKey: ['/v1/livechat/units', options],
		queryFn: async ({ pageParam: offset = 0 }) => {
			const { units, ...data } = await getUnits({
				...(filter && { text: filter }),
				offset,
				count: limit,
				sort: `{ "name": 1 }`,
			});

			return {
				...data,
				units: units.map(formatUnitItem),
			};
		},
		select: (data) => {
			const items = data.pages.flatMap<UnitOption>((page) => page.units);

			haveNone &&
				items.unshift({
					_id: '',
					label: t('None'),
					value: '',
				});

			return items;
		},
		initialPageParam: 0,
		getNextPageParam: (lastPage) => {
			const offset = lastPage.offset + lastPage.count;
			return offset < lastPage.total ? offset : undefined;
		},
		initialData: () => ({
			pages: [{ units: [], offset: 0, count: 0, total: Infinity }],
			pageParams: [0],
		}),
	});
};
