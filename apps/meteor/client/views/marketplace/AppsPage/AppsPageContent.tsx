import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { AppFilters } from './AppsFilters';
import AppsFilters from './AppsFilters';
import AppsPageConnectionError from './AppsPageConnectionError';
import AppsPageContentBody from './AppsPageContentBody';
import AppsPageContentSkeleton from './AppsPageContentSkeleton';
import NoAppRequestsEmptyState from './NoAppRequestsEmptyState';
import NoInstalledAppMatchesEmptyState from './NoInstalledAppMatchesEmptyState';
import NoInstalledAppsEmptyState from './NoInstalledAppsEmptyState';
import NoMarketplaceOrInstalledAppMatchesEmptyState from './NoMarketplaceOrInstalledAppMatchesEmptyState';
import PrivateEmptyState from './PrivateEmptyState';
import UnsupportedEmptyState from './UnsupportedEmptyState';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { AsyncStatePhase } from '../../../lib/asyncState';
import MarketplaceHeader from '../components/MarketplaceHeader';
import { useFilteredApps } from '../hooks/useFilteredApps';
import type { AppsContext } from '../hooks/useFilteredApps';

const AppsPageContent = (): ReactElement => {
	const context = useRouteParameter('context') as AppsContext;

	const filtersForm = useForm<AppFilters>({
		defaultValues: {
			text: '',
			purchaseType: 'all',
			status: 'all',
			categories: [],
			sortingMethod: context === 'requested' ? 'urf' : 'mru',
		},
	});
	const { watch } = filtersForm;

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const router = useRouter();

	const isMarketplace = context === 'explore';
	const isPremium = context === 'premium';

	const { t } = useTranslation();

	const appsResult = useFilteredApps({
		context,
		text: watch('text'),
		purchaseType: watch('purchaseType'),
		status: watch('status'),
		categories: watch('categories'),
		sortingMethod: watch('sortingMethod'),
		current,
		itemsPerPage,
	});

	const noInstalledApps = appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value?.totalAppsLength === 0;

	const unsupportedVersion = appsResult.phase === AsyncStatePhase.REJECTED && appsResult.error.message === 'unsupported version';

	const noMarketplaceOrInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED && (isMarketplace || isPremium) && appsResult.value?.count === 0;

	const noInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED &&
		context === 'installed' &&
		appsResult.value?.totalAppsLength !== 0 &&
		appsResult.value?.count === 0;

	const noAppRequests = context === 'requested' && appsResult?.value?.count === 0;

	const noErrorsOcurred = !noMarketplaceOrInstalledAppMatches && !noInstalledAppMatches && !noInstalledApps && !noAppRequests;

	// FIXME: this actually checks if the filters form is dirty
	const isFiltered =
		Boolean(watch('text')) ||
		watch('purchaseType') !== 'all' ||
		watch('status') !== 'all' ||
		watch('sortingMethod') !== 'mru' ||
		watch('categories').length > 0;

	const handleReturn = () => {
		router.navigate({
			name: 'marketplace',
			params: {
				context: 'explore',
				page: 'list',
			},
		});
	};

	const getEmptyState = () => {
		if (unsupportedVersion) {
			return <UnsupportedEmptyState />;
		}

		if (noAppRequests) {
			return <NoAppRequestsEmptyState />;
		}

		if (noMarketplaceOrInstalledAppMatches) {
			return (
				<NoMarketplaceOrInstalledAppMatchesEmptyState
					shouldShowSearchText={!!appsResult.value?.shouldShowSearchText}
					text={watch('text')}
				/>
			);
		}

		if (noInstalledAppMatches) {
			return (
				<NoInstalledAppMatchesEmptyState
					shouldShowSearchText={!!appsResult.value?.shouldShowSearchText}
					text={watch('text')}
					onButtonClick={handleReturn}
				/>
			);
		}

		if (noInstalledApps) {
			return context === 'private' ? <PrivateEmptyState /> : <NoInstalledAppsEmptyState onButtonClick={handleReturn} />;
		}
	};

	return (
		<>
			<MarketplaceHeader unsupportedVersion={unsupportedVersion} title={t(`Apps_context_${context}`)} />
			<FormProvider {...filtersForm}>
				<AppsFilters context={context || 'explore'} />
			</FormProvider>
			{appsResult.phase === AsyncStatePhase.LOADING && <AppsPageContentSkeleton />}
			{appsResult.phase === AsyncStatePhase.RESOLVED && noErrorsOcurred && !unsupportedVersion && (
				<AppsPageContentBody
					isMarketplace={isMarketplace}
					isFiltered={isFiltered}
					appsResult={appsResult.value}
					itemsPerPage={itemsPerPage}
					current={current}
					onSetItemsPerPage={onSetItemsPerPage}
					onSetCurrent={onSetCurrent}
					paginationProps={paginationProps}
					noErrorsOcurred={noErrorsOcurred}
				/>
			)}
			{getEmptyState()}
			{appsResult.phase === AsyncStatePhase.REJECTED && !unsupportedVersion && <AppsPageConnectionError />}
		</>
	);
};

export default AppsPageContent;
