import { useFocusManager } from '@react-aria/focus';
import { useOverlayTrigger } from '@react-aria/overlays';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { Box, Chip, Icon, IconButton, TextInput } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useRouter, useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import tinykeys from 'tinykeys';

import NavBarSearchListBox from './NavBarSearchListbox';
import { getShortcutLabel } from './getShortcutLabel';
import { useSearchClick } from './hooks/useSearchClick';
import { useSearchFocus } from './hooks/useSearchFocus';
import type { NavBarSearchFormValues } from './hooks/useSearchItems';
import {
	buildAppliedFilterChips,
	emptySearchFilters,
	extractCompletedSearchFilters,
	mergeSearchFilters,
	serializeSearchQuery,
} from './hooks/useSearchItems';
import { useSearchInputNavigation } from './hooks/useSearchNavigation';
import { getURL } from '../../../app/utils/client/getURL';
import GenericUpsellModal from '../../components/GenericUpsellModal';
import { useUpsellActions } from '../../components/GenericUpsellModal/hooks';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

const NavBarSearch = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const shortcut = getShortcutLabel();
	const router = useRouter();
	const setModal = useSetModal();
	const aiSearchFeatureEnabled = useSetting('AI_Intelligent_Search_Feature_Enabled', false);
	const intelligentSearchEnabled = useSetting('AI_Intelligent_Search_Enabled', false);
	const showIntelligentSearch = useSetting('AI_Intelligent_Search_Show_In_Top_Bar', true);
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
	const { handleTalkToSales } = useUpsellActions(hasIntelligentSearchLicense);
	const canUseAISearch = Boolean(hasIntelligentSearchLicense && aiSearchFeatureEnabled);
	const canSearchWithAIFromTopBar = Boolean(canUseAISearch && intelligentSearchEnabled && showIntelligentSearch);

	const searchLabel = canSearchWithAIFromTopBar ? t('Search_rooms_or_ask_AI') : t('Search_rooms');
	const placeholder = [searchLabel, shortcut].filter(Boolean).join(' ');

	const methods = useForm<NavBarSearchFormValues>({ defaultValues: { filterText: '', appliedFilters: emptySearchFilters() } });
	const {
		formState: { isDirty },
		getValues,
		register,
		resetField,
		setFocus,
		setValue,
		watch,
	} = methods;
	const { filterText, appliedFilters } = watch();
	const appliedFilterChips = useMemo(
		() => (canUseAISearch ? buildAppliedFilterChips(appliedFilters) : []),
		[appliedFilters, canUseAISearch],
	);
	const chipContainerRef = useRef<HTMLElement>(null);
	const [chipContainerWidth, setChipContainerWidth] = useState(0);

	const { ref: filterRef, ...rest } = register('filterText');

	const triggerRef = useRef(null);
	const mergedRefs = useMergedRefs(filterRef, triggerRef);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	delete triggerProps.onPress;

	useLayoutEffect(() => {
		const element = chipContainerRef.current;
		if (!element || appliedFilterChips.length === 0) {
			setChipContainerWidth(0);
			return;
		}

		const updateWidth = (): void => setChipContainerWidth(Math.ceil(element.getBoundingClientRect().width));
		updateWidth();

		const resizeObserver = new ResizeObserver(updateWidth);
		resizeObserver.observe(element);

		return (): void => resizeObserver.disconnect();
	}, [appliedFilterChips]);

	const handleKeyDown = useSearchInputNavigation(state);
	const handleFocus = useSearchFocus(state);
	const handleClick = useSearchClick(state);

	const handleEscSearch = useCallback(() => {
		resetField('filterText');
		setValue('appliedFilters', emptySearchFilters());
		state.close();
	}, [resetField, setValue, state]);

	const handleClearText = useCallback(() => {
		resetField('filterText');
		setValue('appliedFilters', emptySearchFilters());
		setFocus('filterText');
	}, [resetField, setFocus, setValue]);

	const handleRemoveFilter = useCallback(
		(filterKey: string) => {
			setValue(
				'appliedFilters',
				{
					...appliedFilters,
					...(filterKey === 'in' && { roomNames: [], rids: [], rid: undefined }),
					...(filterKey === 'from' && { fromUsernames: [], fromUsername: undefined }),
					...(filterKey === 'after' && { startDate: undefined }),
					...(filterKey === 'before' && { endDate: undefined }),
				},
				{ shouldDirty: true },
			);
			setFocus('filterText');
		},
		[appliedFilters, setFocus, setValue],
	);

	const handleIntelligentSearchClick = useCallback(() => {
		if (hasIntelligentSearchLicense) {
			const query = serializeSearchQuery(getValues('filterText'), getValues('appliedFilters'));
			router.navigate({
				name: 'search',
				search: query ? { q: query } : {},
			});
			state.close();
			return;
		}

		setModal(
			<GenericUpsellModal
				aria-label={t('Intelligent_Search')}
				title={t('Intelligent_Search')}
				img={getURL('images/abac-upsell-modal.svg')}
				subtitle={t('Intelligent_Search_upsell_modal_subtitle')}
				description={t('Intelligent_Search_upsell_modal_description')}
				confirmText={t('Contact_sales')}
				onClose={() => setModal(null)}
				onConfirm={handleTalkToSales}
				onCancel={() => setModal(null)}
				imgHeight={256}
			/>,
		);
	}, [getValues, handleTalkToSales, hasIntelligentSearchLicense, router, setModal, state, t]);

	useEffect(() => {
		if (!canUseAISearch || !filterText) {
			return;
		}

		const { searchText, filters, hasCompletedFilters } = extractCompletedSearchFilters(filterText);
		if (!hasCompletedFilters) {
			return;
		}

		setValue('appliedFilters', mergeSearchFilters(appliedFilters, filters), { shouldDirty: true });
		setValue('filterText', searchText, { shouldDirty: true });
	}, [appliedFilters, canUseAISearch, filterText, setValue]);

	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'$mod+K': (event) => {
				event.preventDefault();
				setFocus('filterText');
			},
			'$mod+P': (event) => {
				event.preventDefault();
				setFocus('filterText');
			},
			'Escape': (event) => {
				event.preventDefault();
				handleEscSearch();
			},
		});

		return (): void => {
			unsubscribe();
		};
	}, [focusManager, handleEscSearch, setFocus]);

	return (
		<FormProvider {...methods}>
			<Box width='100%' maxWidth='x622' role='search' aria-label={searchLabel} mi={8} position='relative'>
				{appliedFilterChips.length > 0 && (
					<Box
						ref={chipContainerRef}
						position='absolute'
						display='flex'
						alignItems='center'
						zIndex={1}
						insetBlockStart='50%'
						insetInlineStart={8}
						style={{
							gap: 4,
							transform: 'translateY(-50%)',
							maxWidth: 'min(55%, 360px)',
							height: 24,
							overflow: 'hidden',
							pointerEvents: 'auto',
						}}
					>
						{appliedFilterChips.map((filter) => (
							<Chip key={filter.key} height='x20' value={filter.label} onClick={() => handleRemoveFilter(filter.key)} title={filter.label}>
								<Box is='span' style={{ maxWidth: 132, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
									{filter.label}
								</Box>
							</Chip>
						))}
					</Box>
				)}
				<TextInput
					{...rest}
					{...triggerProps}
					onFocus={handleFocus}
					onKeyDown={handleKeyDown}
					onClick={handleClick}
					autoComplete='off'
					placeholder={placeholder}
					ref={mergedRefs}
					role='combobox'
					aria-autocomplete='list'
					aria-keyshortcuts='Control+K Meta+K Control+P Meta+P'
					small
					style={chipContainerWidth > 0 ? { paddingInlineStart: chipContainerWidth + 16 } : undefined}
					addon={
						<Box display='flex' alignItems='center'>
							{isDirty ? (
								<IconButton mini icon='cross' aria-label={t('Clear')} onClick={handleClearText} />
							) : (
								<Icon name='magnifier' size='x16' aria-label={t('Search')} />
							)}
							{aiSearchFeatureEnabled && (
								<IconButton
									mini
									icon='stars'
									aria-label={hasIntelligentSearchLicense ? t('Search_with_AI') : t('Intelligent_Search_locked')}
									title={hasIntelligentSearchLicense ? t('Search_with_AI') : t('Contact_sales_for_Intelligent_Search')}
									onClick={handleIntelligentSearchClick}
								/>
							)}
						</Box>
					}
				/>
				{state.isOpen && <NavBarSearchListBox state={state} overlayProps={overlayProps} />}
			</Box>
		</FormProvider>
	);
};

export default NavBarSearch;
