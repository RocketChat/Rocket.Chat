import { PaginatedSelectFiltered } from '@rocket.chat/fuselage';

import { AsyncStatePhase } from '../../../lib/asyncState';

export const SettingSelect = ({
	value,
	error,
	placeholder,
	withTitle,
	onChange,
	options,
	Filter,
	setFilter,
	settingPhase,
	loadMoreSettings,
	settingsTotal,
}: {
	value: string;
	error?: string;
	placeholder?: string;
	withTitle?: boolean;
	onChange: (value: string) => void;
	options: { label: string; value: string }[];
	Filter: string;
	setFilter: (value: string | number | undefined) => void;
	settingPhase: string;
	loadMoreSettings: (start: number, end: number) => void;
	settingsTotal: number;
}) => {
	return (
		<PaginatedSelectFiltered
			withTitle={withTitle}
			value={value}
			error={error}
			placeholder={placeholder}
			onChange={onChange}
			flexShrink={0}
			filter={Filter}
			setFilter={setFilter}
			options={options}
			data-qa='autocomplete-agent'
			endReached={
				settingPhase === AsyncStatePhase.LOADING
					? (): void => undefined
					: (start): void => loadMoreSettings(start, Math.min(50, settingsTotal))
			}
		/>
	);
};
