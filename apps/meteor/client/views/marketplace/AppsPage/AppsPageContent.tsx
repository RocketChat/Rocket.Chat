import type { App } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useUniqueId } from '@rocket.chat/fuselage-hooks';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { RefObject } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { PageContent } from '../../../components/Page';
import { AsyncStatePhase, type AsyncState } from '../../../lib/asyncState';
import AppsList from '../AppsList';
import AppsPageConnectionError from './AppsPageConnectionError';
import AppsPageContentSkeleton from './AppsPageContentSkeleton';
import FeaturedAppsSections from './FeaturedAppsSections';
import NoAppRequestsEmptyState from './NoAppRequestsEmptyState';
import NoInstalledAppMatchesEmptyState from './NoInstalledAppMatchesEmptyState';
import NoInstalledAppsEmptyState from './NoInstalledAppsEmptyState';
import NoMarketplaceOrInstalledAppMatchesEmptyState from './NoMarketplaceOrInstalledAppMatchesEmptyState';
import PrivateEmptyState from './PrivateEmptyState';
import UnsupportedEmptyState from './UnsupportedEmptyState';

type AppsPageContentProps = {
	isMarketplace: boolean;
	isFiltered: boolean;
	appsResult: AsyncState<
		PaginatedResult<{
			items: App[];
			shouldShowSearchText: boolean;
			allApps: App[];
			totalAppsLength: number;
		}>
	>;
	scrollableRef: RefObject<HTMLDivElement>;
	unsupportedVersion: boolean;
	text: string;
	context: string;
	reload: () => Promise<void>;
};

const AppsPageContent = ({
	isMarketplace,
	isFiltered,
	appsResult,
	scrollableRef,
	unsupportedVersion,
	reload,
	context,
	text,
}: AppsPageContentProps) => {
	const { t } = useTranslation();
	const appsListId = useUniqueId();

	const router = useRouter();

	const handleReturn = () => {
		router.navigate({
			name: 'marketplace',
			params: {
				context: 'explore',
				page: 'list',
			},
		});
	};

	const isPremium = context === 'premium';

	const noInstalledApps = appsResult.phase === AsyncStatePhase.RESOLVED && !isMarketplace && appsResult.value?.totalAppsLength === 0;

	const noMarketplaceOrInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED && (isMarketplace || isPremium) && appsResult.value?.count === 0;

	const noInstalledAppMatches =
		appsResult.phase === AsyncStatePhase.RESOLVED &&
		context === 'installed' &&
		appsResult.value?.totalAppsLength !== 0 &&
		appsResult.value?.count === 0;

	const noAppRequests = context === 'requested' && appsResult?.value?.count === 0;

	const noErrorsOcurred = !noMarketplaceOrInstalledAppMatches && !noInstalledAppMatches && !noInstalledApps && !noAppRequests;

	const getEmptyState = () => {
		if (unsupportedVersion) {
			return <UnsupportedEmptyState />;
		}

		if (noAppRequests) {
			return <NoAppRequestsEmptyState />;
		}

		if (noMarketplaceOrInstalledAppMatches) {
			return <NoMarketplaceOrInstalledAppMatchesEmptyState shouldShowSearchText={!!appsResult.value?.shouldShowSearchText} text={text} />;
		}

		if (noInstalledAppMatches) {
			return (
				<NoInstalledAppMatchesEmptyState
					shouldShowSearchText={!!appsResult.value?.shouldShowSearchText}
					text={text}
					onButtonClick={handleReturn}
				/>
			);
		}

		if (noInstalledApps) {
			return context === 'private' ? <PrivateEmptyState /> : <NoInstalledAppsEmptyState onButtonClick={handleReturn} />;
		}
	};

	return (
		<PageContent>
			{appsResult.phase === AsyncStatePhase.LOADING && <AppsPageContentSkeleton />}
			{appsResult.phase === AsyncStatePhase.RESOLVED && noErrorsOcurred && !unsupportedVersion && (
				<Box overflowY='scroll' height='100%' ref={scrollableRef}>
					{isMarketplace && !isFiltered && <FeaturedAppsSections appsListId={appsListId} appsResult={appsResult.value?.allApps || []} />}
					<AppsList appsListId={appsListId} apps={appsResult.value?.items || []} title={isMarketplace ? t('All_Apps') : undefined} />
				</Box>
			)}
			{getEmptyState()}
			{appsResult.phase === AsyncStatePhase.REJECTED && !unsupportedVersion && <AppsPageConnectionError onButtonClick={reload} />}
		</PageContent>
	);
};

export default AppsPageContent;
