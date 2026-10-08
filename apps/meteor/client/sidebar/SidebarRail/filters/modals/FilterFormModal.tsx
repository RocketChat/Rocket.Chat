import type { ISidebarFilter, ISidebarFilterRule, SidebarFilterSortBy, SidebarFilterSortDirection } from '@rocket.chat/core-typings';
import { MAX_FILTER_NAME_LENGTH, MAX_SIDEBAR_FILTERS, SYSTEM_LABEL_KEYS } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import {
	Field,
	FieldError,
	FieldGroup,
	FieldHint,
	FieldLabel,
	FieldRow,
	MultiSelectFiltered,
	Select,
	TextInput,
} from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useFormSubmitWithDirtyCheck } from '../../../../hooks/useFormSubmitWithDirtyCheck';
import LabelSelectChip from '../components/LabelSelectChip';
import LabelSelectOption from '../components/LabelSelectOption';
import type { LabelSelectOptionMeta } from '../components/LabelSelectOptionsContext';
import { LabelSelectOptionsContext } from '../components/LabelSelectOptionsContext';
import { useCreateFilter, useUpdateFilter } from '../hooks/useFilterMutations';
import { useSidebarFilters, useSubscriptionLabels } from '../hooks/useSidebarFiltersPreferences';
import { LABEL_COLOR_TOKENS } from '../lib/labelColors';
import { decodeLabelRef, encodeLabelRef } from '../lib/labelRefs';
import { SYSTEM_LABELS } from '../lib/systemLabels';

type RuleFormData = {
	mode: ISidebarFilterRule['mode'];
	labels: string[];
};

type FilterFormData = {
	name: string;
	sortBy: SidebarFilterSortBy;
	sortDirection: SidebarFilterSortDirection;
	matches: RuleFormData;
	notMatches: RuleFormData;
};

const toRuleFormData = (rule?: ISidebarFilterRule): RuleFormData => ({
	mode: rule?.mode ?? 'any',
	labels: rule?.labels.map(encodeLabelRef) ?? [],
});

const toRule = ({ mode, labels }: RuleFormData): ISidebarFilterRule => ({
	mode,
	labels: labels.flatMap((value) => {
		const ref = decodeLabelRef(value);
		return ref ? [ref] : [];
	}),
});

type FilterFormModalProps = {
	filter?: ISidebarFilter;
	onClose: () => void;
};

const FilterFormModal = ({ filter, onClose }: FilterFormModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const labels = useSubscriptionLabels();
	const filters = useSidebarFilters();
	const createFilter = useCreateFilter();
	const updateFilter = useUpdateFilter();

	const {
		handleSubmit,
		control,
		setFocus,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<FilterFormData>({
		mode: 'onSubmit',
		defaultValues: {
			name: filter?.name ?? '',
			sortBy: filter?.sort.by ?? 'activity',
			sortDirection: filter?.sort.direction ?? 'desc',
			matches: toRuleFormData(filter?.matches),
			notMatches: toRuleFormData(filter?.notMatches),
		},
	});

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const { options, optionMeta } = useMemo(() => {
		const systemEntries = SYSTEM_LABEL_KEYS.map((key) => ({
			value: encodeLabelRef({ type: 'system', key }),
			label: t(SYSTEM_LABELS[key].i18n),
			meta: { icon: SYSTEM_LABELS[key].icon },
		}));
		const userEntries = labels.map((label) => ({
			value: encodeLabelRef({ type: 'user', _id: label._id }),
			label: label.name,
			meta: { icon: label.icon, color: LABEL_COLOR_TOKENS[label.color] },
		}));
		const entries = [...systemEntries, ...userEntries];

		return {
			options: entries.map(({ value, label }): [string, string] => [value, label]),
			optionMeta: new Map<string, LabelSelectOptionMeta>(entries.map(({ value, meta }) => [value, meta] as const)),
		};
	}, [labels, t]);

	const modeOptions: [ISidebarFilterRule['mode'], string][] = [
		['any', t('Match_any')],
		['all', t('Match_all')],
	];

	const sortByOptions: [SidebarFilterSortBy, string][] = [
		['activity', t('Activity')],
		['name', t('Name')],
	];

	const sortDirectionOptions: [SidebarFilterSortDirection, string][] = [
		['desc', t('Descending')],
		['asc', t('Ascending')],
	];

	const validateName = (name: string) => {
		const trimmed = name.trim();
		if (!trimmed) {
			return t('Required_field', { field: t('Name') });
		}
		if (trimmed.length > MAX_FILTER_NAME_LENGTH) {
			return t('Max_length_is', { limit: MAX_FILTER_NAME_LENGTH });
		}
		return undefined;
	};

	const validateRules = (_: string[], { matches, notMatches }: FilterFormData) =>
		matches.labels.length + notMatches.labels.length > 0 || t('Filter_needs_a_rule');

	const handleSave = useFormSubmitWithDirtyCheck(
		async ({ name, sortBy, sortDirection, matches, notMatches }: FilterFormData) => {
			const fields = {
				name: name.trim(),
				sort: { by: sortBy, direction: sortDirection },
				matches: toRule(matches),
				notMatches: toRule(notMatches),
			};

			if (filter) {
				await updateFilter.mutateAsync({ filterId: filter._id, ...fields });
			} else {
				await createFilter.mutateAsync(fields);
			}

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onClose();
		},
		// A filter flagged for review is saved even unchanged, since saving is what clears the flag.
		{ isDirty: !filter || Boolean(filter.needsReview) || isDirty },
	);

	const canCreate = Boolean(filter) || filters.length < MAX_SIDEBAR_FILTERS;

	const renderRule = (name: 'matches' | 'notMatches', title: string) => (
		<Field>
			<FieldLabel>{title}</FieldLabel>
			<FieldRow>
				<Controller
					control={control}
					name={`${name}.mode`}
					render={({ field: { value, onChange } }) => (
						<Select aria-label={t('Match')} value={value} onChange={onChange} options={modeOptions} width='x144' />
					)}
				/>
			</FieldRow>
			<FieldRow>
				<Controller
					control={control}
					name={`${name}.labels`}
					rules={name === 'matches' ? { validate: validateRules } : undefined}
					render={({ field: { value, onChange } }) => (
						<MultiSelectFiltered
							aria-label={title}
							value={value}
							onChange={onChange}
							options={options}
							placeholder={t('Labels')}
							renderItem={LabelSelectOption}
							renderSelected={LabelSelectChip}
							error={name === 'matches' ? errors.matches?.labels?.message : undefined}
							aria-invalid={name === 'matches' && errors.matches?.labels ? 'true' : 'false'}
						/>
					)}
				/>
			</FieldRow>
			{name === 'matches' && errors.matches?.labels && <FieldError>{errors.matches.labels.message}</FieldError>}
		</Field>
	);

	return (
		<GenericModal
			title={filter ? t('Edit_filter') : t('Create_filter')}
			variant='warning'
			icon={null}
			confirmText={t('Save')}
			confirmLoading={isSubmitting}
			confirmDisabled={!canCreate}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleSave)} {...props} />}
		>
			<LabelSelectOptionsContext.Provider value={optionMeta}>
				<FieldGroup>
					<Field>
						<FieldLabel required>{t('Name')}</FieldLabel>
						<FieldRow>
							<Controller
								control={control}
								name='name'
								rules={{ validate: validateName }}
								render={({ field }) => (
									<TextInput autoComplete='off' error={errors.name?.message} aria-invalid={errors.name ? 'true' : 'false'} {...field} />
								)}
							/>
						</FieldRow>
						{errors.name && <FieldError>{errors.name.message}</FieldError>}
					</Field>
					<Field>
						<FieldLabel>{t('Sort_By')}</FieldLabel>
						<FieldRow>
							<Box display='flex' gap={8} width='full'>
								<Box flexGrow={1}>
									<Controller
										control={control}
										name='sortBy'
										render={({ field: { value, onChange } }) => (
											<Select aria-label={t('Sort_By')} value={value} onChange={onChange} options={sortByOptions} />
										)}
									/>
								</Box>
								<Box flexGrow={1}>
									<Controller
										control={control}
										name='sortDirection'
										render={({ field: { value, onChange } }) => (
											<Select aria-label={t('Direction')} value={value} onChange={onChange} options={sortDirectionOptions} />
										)}
									/>
								</Box>
							</Box>
						</FieldRow>
					</Field>
					{renderRule('matches', t('Show_rooms_with'))}
					{renderRule('notMatches', t('Hide_rooms_with'))}
					{!canCreate && <FieldHint>{t('Filters_limit_reached')}</FieldHint>}
				</FieldGroup>
			</LabelSelectOptionsContext.Provider>
		</GenericModal>
	);
};

export default FilterFormModal;
