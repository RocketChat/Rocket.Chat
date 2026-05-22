/* eslint-disable react/no-multi-comp */
import { useOverlayTrigger } from '@react-aria/overlays';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useRouter, useSearchParameter, useSetModal, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import tinykeys from 'tinykeys';

import NavBarSearchListBox from './NavBarSearchListbox';
import { getShortcutLabel } from './getShortcutLabel';
import { useSearchClick } from './hooks/useSearchClick';
import { useSearchFocus } from './hooks/useSearchFocus';
import { useSearchInputNavigation } from './hooks/useSearchNavigation';
import { getURL } from '../../../app/utils/client/getURL';
import GenericUpsellModal from '../../components/GenericUpsellModal';
import { useUpsellActions } from '../../components/GenericUpsellModal/hooks';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

type SearchFilters = {
	rid?: string;
	ridName?: string;
	fromUser?: string;
	afterDate?: string;
	beforeDate?: string;
};

const roomLookupQuery = { open: { $ne: false } };
const roomLookupOptions = { limit: 100 } as const;
const filterTokenRegex = /(^|\s)(in|from|after|before):([^\s]+)(?=\s)/gi;
const finalFilterTokenRegex = /(^|\s)(in|from|after|before):([^\s]+)$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const getRoomFilter = (value: string, rooms: ReturnType<typeof useUserSubscriptions>): Pick<SearchFilters, 'rid' | 'ridName'> => {
	const normalizedValue = value.replace(/^#/, '').toLowerCase();
	const room = rooms.find(({ name, fname }) => [name, fname].some((roomName) => roomName?.toLowerCase() === normalizedValue));

	if (!room) {
		return { ridName: value.replace(/^#/, '') };
	}

	return {
		rid: room.rid || room._id,
		ridName: room.fname || room.name,
	};
};

const parseFilterTokens = (value: string, rooms: ReturnType<typeof useUserSubscriptions>, includeFinalToken = false) => {
	const nextFilters: Partial<SearchFilters> = {};
	const parser = (match: string, leadingWhitespace: string, rawKind: string, rawTokenValue: string) => {
		const kind = rawKind.toLowerCase();
		const tokenValue = rawTokenValue.trim();

		if (!tokenValue) {
			return match;
		}

		if (kind === 'in') {
			Object.assign(nextFilters, getRoomFilter(tokenValue, rooms));
			return leadingWhitespace;
		}

		if (kind === 'from') {
			nextFilters.fromUser = tokenValue.replace(/^@/, '');
			return leadingWhitespace;
		}

		if ((kind === 'after' || kind === 'before') && dateRegex.test(tokenValue)) {
			nextFilters[kind === 'after' ? 'afterDate' : 'beforeDate'] = tokenValue;
			return leadingWhitespace;
		}

		return match;
	};

	let remainingText = value
		.replace(filterTokenRegex, (match, leadingWhitespace: string, rawKind: string, rawTokenValue: string) => {
			return parser(match, leadingWhitespace, rawKind, rawTokenValue);
		})
		.replace(/\s{2,}/g, ' ')
		.trimStart();

	if (includeFinalToken) {
		remainingText = remainingText
			.replace(finalFilterTokenRegex, (match, leadingWhitespace: string, rawKind: string, rawTokenValue: string) => {
				return parser(match, leadingWhitespace, rawKind, rawTokenValue);
			})
			.replace(/\s{2,}/g, ' ')
			.trim();
	}

	return { remainingText, nextFilters };
};

const SearchChip = ({ icon, label, onRemove }: { icon: string; label: string; onRemove: () => void }): ReactElement => (
	<Box
		display='flex'
		alignItems='center'
		flexShrink={0}
		borderRadius='full'
		bg='surface-selected'
		height='x20'
		pis={6}
		pie={2}
		fontScale='c1'
		style={{
			gap: 2,
			whiteSpace: 'nowrap',
			backgroundColor: 'var(--rcx-color-surface-hover)',
			border: '1px solid var(--rcx-color-stroke-light)',
			color: 'var(--rcx-color-font-default)',
		}}
	>
		<Icon name={icon as 'hash'} size='x12' />
		<Box is='span'>{label}</Box>
		<IconButton mini icon='cross' aria-label={label} onClick={onRemove} />
	</Box>
);

const NavBarSearch = () => {
	const { t } = useTranslation();
	const shortcut = getShortcutLabel();
	const router = useRouter();
	const setModal = useSetModal();
	const queryParam = useSearchParameter('q') ?? '';
	const ridParam = useSearchParameter('rid') ?? undefined;
	const ridNameParam = useSearchParameter('ridName') ?? undefined;
	const fromUserParam = useSearchParameter('fromUser') ?? undefined;
	const afterDateParam = useSearchParameter('afterDate') ?? undefined;
	const beforeDateParam = useSearchParameter('beforeDate') ?? undefined;
	const { data: hasIntelligentSearchLicense = false } = useHasLicenseModule('chat.rocket.rc-ai');
	const { handleTalkToSales } = useUpsellActions(hasIntelligentSearchLicense);
	const rooms = useUserSubscriptions(roomLookupQuery, roomLookupOptions);

	const placeholder = [t('Search_users_rooms_messages'), shortcut].filter(Boolean).join(' ');
	const [filterText, setFilterText] = useState('');
	const [filters, setFilters] = useState<SearchFilters>({});
	const inputRef = useRef<HTMLInputElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);
	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	const { onPress: _onPress, ...boxTriggerProps } = triggerProps;
	const isSearchRoute = router.getRouteName() === 'search';

	const handleSearchKeyDown = useSearchInputNavigation(state);
	const handleFocus = useSearchFocus(state);
	const handleClick = useSearchClick(state);

	useEffect(() => {
		if (!isSearchRoute) {
			return;
		}

		setFilterText(queryParam);
		setFilters({
			rid: ridParam,
			ridName: ridNameParam || ridParam,
			fromUser: fromUserParam,
			afterDate: afterDateParam,
			beforeDate: beforeDateParam,
		});
	}, [afterDateParam, beforeDateParam, fromUserParam, isSearchRoute, queryParam, ridNameParam, ridParam]);

	const navigateToSearch = useCallback(
		(nextFilterText: string, tab?: string): void => {
			const searchParams = new URLSearchParams();
			const { remainingText, nextFilters } = parseFilterTokens(nextFilterText, rooms, true);
			const nextFiltersState = { ...filters, ...nextFilters };

			if (remainingText.trim()) {
				searchParams.set('q', remainingText.trim());
			}
			if (tab) {
				searchParams.set('tab', tab);
			}
			if (nextFiltersState.rid) {
				searchParams.set('rid', nextFiltersState.rid);
			}
			if (nextFiltersState.ridName) {
				searchParams.set('ridName', nextFiltersState.ridName);
			}
			if (nextFiltersState.fromUser) {
				searchParams.set('fromUser', nextFiltersState.fromUser);
			}
			if (nextFiltersState.afterDate) {
				searchParams.set('afterDate', nextFiltersState.afterDate);
			}
			if (nextFiltersState.beforeDate) {
				searchParams.set('beforeDate', nextFiltersState.beforeDate);
			}

			router.navigate({
				name: 'search',
				search: Object.fromEntries(searchParams.entries()),
			});
			state.close();
		},
		[filters, rooms, router, state],
	);

	const updateFilterText = useCallback(
		(value: string) => {
			const { remainingText, nextFilters } = parseFilterTokens(value, rooms);
			setFilterText(remainingText);
			if (Object.keys(nextFilters).length > 0) {
				setFilters((currentFilters) => ({ ...currentFilters, ...nextFilters }));
			}
		},
		[rooms],
	);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			updateFilterText(event.currentTarget.value);
		},
		[updateFilterText],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>): void => {
			if (event.key === 'Enter') {
				event.preventDefault();
				navigateToSearch(filterText);
				return;
			}

			handleSearchKeyDown(event);
		},
		[filterText, handleSearchKeyDown, navigateToSearch],
	);

	const handleEscSearch = useCallback(() => {
		setFilterText('');
		setFilters({});
		state.close();
	}, [state]);

	const clearAll = useCallback(() => {
		setFilterText('');
		setFilters({});
		inputRef.current?.focus();
	}, []);

	const handleRemoveFilter = useCallback((key: keyof SearchFilters) => {
		setFilters((currentFilters) => {
			if (key === 'rid' || key === 'ridName') {
				return { ...currentFilters, rid: undefined, ridName: undefined };
			}

			return { ...currentFilters, [key]: undefined };
		});
		inputRef.current?.focus();
	}, []);

	const handleApplyRoomFilter = useCallback((room: { _id: string; name?: string; fname?: string }) => {
		setFilters((currentFilters) => ({
			...currentFilters,
			rid: room._id,
			ridName: room.fname || room.name || room._id,
		}));
		inputRef.current?.focus();
	}, []);

	const handleIntelligentSearchClick = useCallback(() => {
		if (hasIntelligentSearchLicense) {
			navigateToSearch(filterText, 'messages');
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
	}, [filterText, handleTalkToSales, hasIntelligentSearchLicense, navigateToSearch, setModal, t]);

	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'$mod+K': (event) => {
				event.preventDefault();
				inputRef.current?.focus();
			},
			'$mod+P': (event) => {
				event.preventDefault();
				inputRef.current?.focus();
			},
			'Escape': (event) => {
				event.preventDefault();
				handleEscSearch();
			},
		});

		return (): void => {
			unsubscribe();
		};
	}, [handleEscSearch]);

	const chips = useMemo(
		() =>
			[
				filters.ridName
					? {
							key: 'ridName' as const,
							icon: 'hash' as const,
							label: `in: #${filters.ridName}`,
						}
					: null,
				filters.fromUser
					? {
							key: 'fromUser' as const,
							icon: 'at' as const,
							label: `from: @${filters.fromUser}`,
						}
					: null,
				filters.afterDate
					? {
							key: 'afterDate' as const,
							icon: 'calendar' as const,
							label: `after: ${filters.afterDate}`,
						}
					: null,
				filters.beforeDate
					? {
							key: 'beforeDate' as const,
							icon: 'calendar' as const,
							label: `before: ${filters.beforeDate}`,
						}
					: null,
			].filter(Boolean) as Array<{ key: keyof SearchFilters; icon: 'hash' | 'at' | 'calendar'; label: string }>,
		[filters.afterDate, filters.beforeDate, filters.fromUser, filters.ridName],
	);
	const hasFilters = chips.length > 0;
	const isDirty = Boolean(filterText.trim() || hasFilters);

	return (
		<Box width='100%' maxWidth='x622' role='search' aria-label={t('Search_rooms')} mi={8} position='relative'>
			<Box
				{...boxTriggerProps}
				ref={triggerRef}
				display='flex'
				alignItems='center'
				width='100%'
				height='x32'
				pi={8}
				borderRadius='x4'
				border='1px solid'
				borderColor='neutral-500'
				bg='surface-light'
				overflow='hidden'
				style={{ gap: 4, cursor: 'text' }}
				onClick={() => inputRef.current?.focus()}
			>
				<Box display='flex' alignItems='center' flexGrow={1} overflow='hidden' style={{ gap: 4 }}>
					{chips.map(({ key, icon, label }) => (
						<SearchChip key={key} icon={icon} label={label} onRemove={() => handleRemoveFilter(key)} />
					))}
					<input
						ref={inputRef}
						value={filterText}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						onClick={handleClick}
						placeholder={hasFilters ? '' : placeholder}
						autoComplete='off'
						role='combobox'
						aria-autocomplete='list'
						aria-controls='navbar-search-listbox'
						aria-expanded={state.isOpen}
						aria-keyshortcuts='Control+K Meta+K Control+P Meta+P'
						style={{
							border: 'none',
							background: 'transparent',
							outline: 'none',
							flex: 1,
							minWidth: 60,
							color: 'var(--rcx-color-font-default)',
							fontSize: 'var(--rcx-font-size-p2)',
						}}
					/>
				</Box>
				<Box display='flex' alignItems='center' flexShrink={0} style={{ gap: 2 }}>
					{isDirty ? <IconButton mini icon='cross' aria-label={t('Clear')} onClick={clearAll} /> : <Icon name='magnifier' size='x16' />}
					<IconButton
						mini
						icon='stars'
						aria-label={hasIntelligentSearchLicense ? t('Intelligent_Search') : t('Intelligent_Search_locked')}
						title={hasIntelligentSearchLicense ? t('Intelligent_Search') : t('Contact_sales_for_Intelligent_Search')}
						onClick={handleIntelligentSearchClick}
					/>
				</Box>
			</Box>
			{state.isOpen && (
				<NavBarSearchListBox
					state={state}
					overlayProps={overlayProps}
					filterText={filterText}
					onFilterTextChange={setFilterText}
					onSelect={state.close}
					onNavigateToSearch={() => navigateToSearch(filterText)}
					onApplyRoomFilter={handleApplyRoomFilter}
				/>
			)}
		</Box>
	);
};

export default NavBarSearch;
