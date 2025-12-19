import { Box, Icon, TextInput, Select } from '@rocket.chat/fuselage';
import type { OptionProp } from '@rocket.chat/ui-client';
import { MultiSelectCustom } from '@rocket.chat/ui-client';
import { useCallback, useMemo, useState } from 'react';
import type { FormEvent, Key } from 'react';
import { useTranslation } from 'react-i18next';

type StatesFilter = Array<'ended' | 'transferred' | 'not-answered' | 'failed'>;
type TypeFilter = 'inbound' | 'outbound' | 'all';

type CallHistoryPageFiltersProps = {
	onChangeText: (nameOrUsernameOrExtension: string) => void;
	onChangeType: (type: TypeFilter) => void;
	onChangeStates: (states: StatesFilter) => void;
	searchText: string;
	type: TypeFilter;
	states: StatesFilter;
};

const typeOptions = [
	{ id: 'inbound', text: 'Inbound' },
	{ id: 'outbound', text: 'Outbound' },
	{ id: 'all', text: 'All_directions' },
] as const;

const statesOptions = [
	{ id: 'filter_by_status', text: 'Filter_By_Status', isGroupTitle: true },
	{ id: 'ended', text: 'Ended', icon: { name: 'phone-off', color: 'default' } },
	{ id: 'transferred', text: 'Transferred', icon: { name: 'arrow-forward', color: 'default' } },
	{ id: 'not-answered', text: 'Not_answered', icon: { name: 'phone-question-mark', color: 'warning' } },
	{ id: 'failed', text: 'Failed', icon: { name: 'phone-issue', color: 'danger' } },
] as const;

export const useCallHistoryPageFilters = () => {
	const [searchText, setSearchText] = useState('');
	const [type, setType] = useState<TypeFilter>('all');
	const [states, setStates] = useState<StatesFilter>(['ended', 'transferred', 'not-answered', 'failed']);

	const onChangeText = useCallback((text: string) => {
		setSearchText(text);
	}, []);

	const onChangeType = useCallback((type: TypeFilter) => {
		setType(type);
	}, []);

	const onChangeStates = useCallback((states: StatesFilter) => {
		setStates(states);
	}, []);

	return { searchText, type, states, onChangeText, onChangeType, onChangeStates };
};

const CallHistoryPageFilters = ({ onChangeText, onChangeType, onChangeStates, searchText, type, states }: CallHistoryPageFiltersProps) => {
	const { t } = useTranslation();

	const selectTypeOptions: [string, string, boolean][] = useMemo(() => {
		return typeOptions.map((option) => [option.id, t(option.text), option.id === type]);
	}, [type, t]);

	const handleChangeType = useCallback(
		(options: OptionProp[]) => {
			onChangeStates(options.map((option) => option.id) as StatesFilter);
		},
		[onChangeStates],
	);

	const dropdownStatesOptions = useMemo(() => {
		return statesOptions.map((option) => ({
			...option,
			checked: option.id !== 'filter_by_status' && states.includes(option.id),
		}));
	}, [states]);

	const selectedOptions = useMemo(() => {
		return statesOptions.filter((option) => option.id !== 'filter_by_status' && states.includes(option.id));
	}, [states]);

	return (
		<Box
			is='form'
			onSubmit={useCallback((e: FormEvent) => e.preventDefault(), [])}
			mb='x8'
			display='flex'
			flexWrap='wrap'
			alignItems='center'
			justifyContent='center'
		>
			<Box minWidth='x224' display='flex' m='x4' flexGrow={2}>
				<TextInput
					name='search-rooms'
					alignItems='center'
					placeholder={t('Search_calls')}
					addon={<Icon name='magnifier' size='x20' />}
					onChange={(e: FormEvent<HTMLInputElement>) => onChangeText(e.currentTarget.value)}
					value={searchText}
				/>
			</Box>
			<Box minWidth='x224' m='x4' flexGrow={1} alignItems='stretch' display='flex'>
				<Select options={selectTypeOptions} value={type} onChange={(key: Key) => onChangeType(key as TypeFilter)} />
			</Box>
			<Box minWidth='x224' m='x4' flexGrow={1}>
				<MultiSelectCustom
					dropdownOptions={dropdownStatesOptions}
					defaultTitle='All_status'
					selectedOptionsTitle='Status'
					selectedOptions={selectedOptions}
					setSelectedOptions={handleChangeType}
				/>
			</Box>
		</Box>
	);
};

export default CallHistoryPageFilters;
