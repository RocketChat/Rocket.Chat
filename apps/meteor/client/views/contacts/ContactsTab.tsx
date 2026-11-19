import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ContactsSortableField } from '@rocket.chat/rest-typings';
import { GenericNoResults, GenericTableLoadingRow, usePagination, useSort } from '@rocket.chat/ui-client';
import { useEndpoint, useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ContactPanelRouter from './ContactPanelRouter';
import ContactsPageFilters from './ContactsPageFilters';
import ContactsTable from './ContactsTable';
import ContactsTableRow from './ContactsTableRow';
import { useContactsColumns } from './hooks/useContactsColumns';
import { contactsQueryKeys } from '../../lib/queryKeys';
import type { CallHistoryTab } from '../mediaCallHistory/CallHistoryPageLayout';
import CallHistoryPageLayout from '../mediaCallHistory/CallHistoryPageLayout';

type ContactsTabProps = {
	tab: Exclude<CallHistoryTab, 'calls'>;
	onChangeTab: (tab: CallHistoryTab) => void;
};

const LOADING_ROWS = 4;

const ContactsTab = ({ tab, onChangeTab }: ContactsTabProps) => {
	const { t } = useTranslation();
	const sortProps = useSort<ContactsSortableField>('displayName', 'asc');
	const { setItemsPerPage, setCurrent, ...paginationProps } = usePagination();
	const columns = useContactsColumns();
	// The favorite and menu cells are on every row and no setting hides them, so they are not part of the visible count.
	const loadingCols = columns.visibleCount + 2;

	const router = useRouter();
	const contactId = useRouteParameter('historyId');
	const context = useRouteParameter('context');

	const favoritesOnly = tab === 'favorites';
	const emptyTitle = favoritesOnly ? t('No_favorite_contacts') : t('No_contacts');
	const emptyDescription = favoritesOnly ? t('No_favorite_contacts_description') : t('No_contacts_description');

	const openList = useCallback(() => router.navigate(`/call-history/${tab}`), [router, tab]);
	const openInfo = useCallback((id: string) => router.navigate(`/call-history/${tab}/${id}`), [router, tab]);
	const openEdit = useCallback((id: string) => router.navigate(`/call-history/${tab}/${id}/edit`), [router, tab]);

	const listContacts = useEndpoint('GET', '/v1/contacts.list');

	const [searchText, setSearchText] = useState('');
	const debouncedSearchText = useDebouncedValue(searchText, 400);

	useEffect(() => {
		setCurrent(0);
	}, [debouncedSearchText, setCurrent]);

	const { data, isPending, error, refetch } = useQuery({
		queryKey: contactsQueryKeys.list({
			sortBy: sortProps.sortBy,
			sortDirection: sortProps.sortDirection,
			offset: paginationProps.current,
			count: paginationProps.itemsPerPage,
			text: debouncedSearchText,
			...(favoritesOnly && { favorite: true }),
		}),
		queryFn: () =>
			listContacts({
				count: paginationProps.itemsPerPage,
				offset: paginationProps.current,
				sort: JSON.stringify({ [sortProps.sortBy]: sortProps.sortDirection === 'asc' ? 1 : -1 }),
				...(debouncedSearchText && { text: debouncedSearchText }),
				...(favoritesOnly && { favorite: true }),
			}),
	});

	const isPastLastPage = !!data && paginationProps.current > 0 && paginationProps.current >= data.total;
	const lastPageOffset = Math.max(0, Math.ceil((data?.total ?? 0) / paginationProps.itemsPerPage) - 1) * paginationProps.itemsPerPage;

	useEffect(() => {
		if (isPastLastPage) {
			setCurrent((offset) => Math.min(offset, lastPageOffset));
		}
	}, [isPastLastPage, lastPageOffset, setCurrent]);

	const contactFilters = (
		<ContactsPageFilters
			searchText={searchText}
			onChangeText={setSearchText}
			onCreate={favoritesOnly ? undefined : () => openInfo('new')}
			placeholder={favoritesOnly ? t('Search_favorites') : t('Search_contacts')}
			total={data?.syncedTotal ?? 0}
		/>
	);

	const contextualBar = (
		<ContactPanelRouter contactId={contactId} context={context} onOpenInfo={openInfo} onOpenEdit={openEdit} onClose={openList} />
	);

	const pagination = (
		<Pagination divider count={data?.total || 0} onSetItemsPerPage={setItemsPerPage} onSetCurrent={setCurrent} {...paginationProps} />
	);

	if (isPending || isPastLastPage) {
		return (
			<CallHistoryPageLayout filters={contactFilters} contextualBar={contextualBar} tab={tab} onChangeTab={onChangeTab}>
				<ContactsTable sort={sortProps} sortableByFavorite={!favoritesOnly} columns={columns}>
					{Array.from({ length: LOADING_ROWS }, (_, index) => (
						<GenericTableLoadingRow key={index} cols={loadingCols} />
					))}
				</ContactsTable>
				{pagination}
			</CallHistoryPageLayout>
		);
	}

	if (error) {
		return (
			<CallHistoryPageLayout filters={contactFilters} contextualBar={contextualBar} tab={tab} onChangeTab={onChangeTab}>
				<GenericNoResults
					icon='warning'
					title={t('Something_went_wrong')}
					description={t('Please_try_again')}
					buttonTitle={t('Reload_page')}
					buttonAction={() => refetch()}
				/>
			</CallHistoryPageLayout>
		);
	}

	return (
		<CallHistoryPageLayout filters={contactFilters} contextualBar={contextualBar} tab={tab} onChangeTab={onChangeTab}>
			{data.items.length === 0 && (
				<GenericNoResults
					icon={favoritesOnly ? 'star' : 'address-book'}
					title={debouncedSearchText ? t('No_results_found') : emptyTitle}
					description={debouncedSearchText ? undefined : emptyDescription}
				/>
			)}
			{data.items.length > 0 && (
				<ContactsTable sort={sortProps} sortableByFavorite={!favoritesOnly} columns={columns}>
					{data.items.map((contact) => (
						<ContactsTableRow
							key={contact._id}
							contact={contact}
							columns={columns}
							onClick={() => openInfo(contact._id)}
							onEdit={() => openEdit(contact._id)}
							onDeleted={() => contactId === contact._id && openList()}
						/>
					))}
				</ContactsTable>
			)}
			{pagination}
		</CallHistoryPageLayout>
	);
};

export default ContactsTab;
