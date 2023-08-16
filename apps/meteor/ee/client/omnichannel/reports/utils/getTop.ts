import type { TranslationContextValue } from '@rocket.chat/ui-contexts';

export const getTop = (limit = 5, data: { label: string; value: number }[] | undefined = [], t: TranslationContextValue['translate']) => {
	if (data.length < limit) {
		return data;
	}

	const topItems = data.slice(0, limit);
	const others = data.slice(limit).reduce(
		(acc, item) => {
			acc.value += item.value;
			return acc;
		},
		{ label: t('Others'), value: 0 },
	);

	return [...topItems, others];
};
