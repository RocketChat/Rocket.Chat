import { setDefaultOptions } from 'date-fns';

import { getDateFnsLocale } from '../../../lib/getDateFnsLocale';

export const setDateFnsLocale = async (language: string): Promise<void> => {
	const locale = await getDateFnsLocale(language);
	setDefaultOptions({ locale });
};
