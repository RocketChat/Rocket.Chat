import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useQuery } from '@tanstack/react-query';
import { useContext, useMemo, useRef } from 'react';

import { UiKitContext } from '../../../contexts/UiKitContext';

export type ExternalSelectOption = { value: string; label: string };

const DEFAULT_MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 3000;

const toOption = ({ value, text }: UiKit.Option): ExternalSelectOption => ({ value, label: text.text });

const withTimeout = <T>(promise: Promise<T>) =>
	new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error('Suggestion timeout')), TIMEOUT_MS);
		promise.then(resolve, reject).finally(() => clearTimeout(timer));
	});

type Params = {
	block: UiKit.ExternalSelectElement | UiKit.MultiExternalSelectElement;
	filter: string;
	selected: string[];
	initialOptions?: UiKit.Option[];
};

/** Options the app suggests for the filter, plus the selected ones so their chips keep their labels. */
export const useExternalSelectOptions = ({ block, filter, selected, initialOptions = [] }: Params) => {
	const { suggest, appId: appIdFromContext, viewId } = useContext(UiKitContext);
	const appId = block.appId || appIdFromContext || 'core';

	const debouncedFilter = useDebouncedValue(filter, DEBOUNCE_MS);
	const enabled = !!suggest && debouncedFilter.length >= (block.min_query_length ?? DEFAULT_MIN_QUERY_LENGTH);

	const { data } = useQuery({
		queryKey: ['uikit-external-select', appId, block.actionId, debouncedFilter],
		queryFn: async () => {
			if (!suggest) {
				return [];
			}

			const { options = [], option_groups = [] } = await withTimeout(
				suggest({ appId, actionId: block.actionId, blockId: block.blockId, value: debouncedFilter, viewId }),
			);
			return [...options, ...option_groups.flatMap((group) => group.options)].map(toOption);
		},
		enabled,
		retry: false,
		staleTime: 0,
	});

	const known = useRef(new Map<string, string>());
	initialOptions.forEach(({ value, text }) => known.current.set(value, text.text));

	return useMemo(() => {
		const suggested = enabled ? (data ?? []) : [];
		suggested.forEach(({ value, label }) => known.current.set(value, label));

		const extra = selected
			.filter((value) => !suggested.some((option) => option.value === value))
			.map((value): ExternalSelectOption => ({ value, label: known.current.get(value) ?? value }));

		return [...suggested, ...extra];
	}, [enabled, data, selected]);
};
