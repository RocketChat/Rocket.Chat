import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo, useState } from 'react';

export const useCannedResponseFilterOptions = (): string[][] => {
	const t = useTranslation();
	const getDepartments = useEndpoint('GET', 'livechat/department');

	const defaultOptions = useMemo(
		() => [
			['all', t('All')],
			['global', t('Public')],
			['user', t('Private')],
		],
		[t],
	);

	const [options, setOptions] = useState(defaultOptions);

	useEffect(() => {
		const fetchData = async (): Promise<void> => {
			const { departments } = await getDepartments({ text: '' });

			const newOptions = departments.map((department: any) => [department._id, department.name]);

			setOptions(defaultOptions.concat(newOptions));
		};

		fetchData();
	}, [defaultOptions, getDepartments]);

	return options;
};
