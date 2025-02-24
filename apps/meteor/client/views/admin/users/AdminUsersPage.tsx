import type { LicenseInfo } from '@rocket.chat/core-typings';
import { Callout, ContextualbarIcon, Icon, Skeleton, Tabs, TabsItem } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { OptionProp } from '@rocket.chat/ui-client';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useRouteParameter, useTranslation, useRouter, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Trans } from 'react-i18next';

import AdminInviteUsers from './AdminInviteUsers';
import AdminUserCreated from './AdminUserCreated';
import AdminUserForm from './AdminUserForm';
import AdminUserFormWithData from './AdminUserFormWithData';
import AdminUserInfoWithData from './AdminUserInfoWithData';
import AdminUserUpgrade from './AdminUserUpgrade';
import UsersPageHeaderContent from './UsersPageHeaderContent';
import UsersTable from './UsersTable';
import useFilteredUsers from './hooks/useFilteredUsers';
import usePendingUsersCount from './hooks/usePendingUsersCount';
import { useSeatsCap } from './useSeatsCap';
import {
	Contextualbar,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarDialog,
} from '../../../components/Contextualbar';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import { Page, PageHeader, PageContent } from '../../../components/Page';
import { useLicenseLimitsByBehavior } from '../../../hooks/useLicenseLimitsByBehavior';
import { useShouldPreventAction } from '../../../hooks/useShouldPreventAction';
import { useCheckoutUrl } from '../subscription/hooks/useCheckoutUrl';

export type UsersFilters = {
	text: string;
	roles: OptionProp[];
};

export type AdminUsersTab = 'all' | 'active' | 'deactivated' | 'pending';

export type UsersTableSortingOption = 'name' | 'username' | 'emails.address' | 'status' | 'active' | 'freeSwitchExtension';

const AdminUsersPage = (): ReactElement => {
	const t = useTranslation();

	const seatsCap = useSeatsCap();

	const isSeatsCapExceeded = useShouldPreventAction('activeUsers');
	const { prevent_action: preventAction } = useLicenseLimitsByBehavior() ?? {};
	const manageSubscriptionUrl = useCheckoutUrl();

	const router = useRouter();
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const isCreateUserDisabled = useShouldPreventAction('activeUsers');

	const getRoles = useEndpoint('GET', '/v1/roles.list');
	const { data, error } = useQuery({
		queryKey: ['roles'],
		queryFn: async () => getRoles(),
	});

	const paginationData = usePagination();
	const sortData = useSort<UsersTableSortingOption>('name');

	const [tab, setTab] = useState<AdminUsersTab>('all');
	const [userFilters, setUserFilters] = useState<UsersFilters>({ text: '', roles: [] });

	const searchTerm = useDebouncedValue(userFilters.text, 500);
	const prevSearchTerm = useRef('');

	const filteredUsersQueryResult = useFilteredUsers({
		searchTerm,
		prevSearchTerm,
		sortData,
		paginationData,
		tab,
		selectedRoles: useMemo(() => userFilters.roles.map((role) => role.id), [userFilters.roles]),
	});

	const pendingUsersCount = usePendingUsersCount(filteredUsersQueryResult.data?.users);

	const handleReload = (): void => {
		seatsCap?.reload();
		filteredUsersQueryResult?.refetch();
	};

	const handleTabChange = (tab: AdminUsersTab) => {
		setTab(tab);

		paginationData.setCurrent(0);
		sortData.setSort(tab === 'pending' ? 'active' : 'name', 'asc');
	};

	useEffect(() => {
		prevSearchTerm.current = searchTerm;
	}, [searchTerm]);

	const isRoutePrevented = useMemo(
		() => context && ['new', 'invite'].includes(context) && isCreateUserDisabled,
		[context, isCreateUserDisabled],
	);

	const toTranslationKey = (key: keyof LicenseInfo['limits']) => t(`subscription.callout.${key}`);

	return (
		<Page flexDirection='row'>
			<Page>
				<PageHeader title={t('Users')}>
					<UsersPageHeaderContent isSeatsCapExceeded={isSeatsCapExceeded} seatsCap={seatsCap} />
				</PageHeader>
				{preventAction?.includes('activeUsers') && (
					<Callout type='danger' title={t('subscription.callout.servicesDisruptionsOccurring')} mbe={19} mi={24}>
						<Trans
							i18nKey='subscription.callout.description.limitsExceeded'
							count={preventAction.length}
							values={{ val: preventAction.map(toTranslationKey) }}
						>
							Your workspace exceeded the <>{preventAction.map(toTranslationKey)}</> license limit.
							<ExternalLink
								to={manageSubscriptionUrl({
									target: 'callout',
									action: 'prevent_action',
									limits: preventAction.join(','),
								})}
							>
								Manage your subscription
							</ExternalLink>
							to increase limits.
						</Trans>
					</Callout>
				)}
				<Tabs>
					<TabsItem selected={!tab || tab === 'all'} onClick={() => handleTabChange('all')}>
						{t('All')}
					</TabsItem>
					<TabsItem selected={tab === 'pending'} onClick={() => handleTabChange('pending')} display='flex' flexDirection='row'>
						{`${t('Pending')} `}
						{pendingUsersCount.isLoading && <Skeleton variant='circle' height='x16' width='x16' mis={8} />}
						{pendingUsersCount.isSuccess && `(${pendingUsersCount.data})`}
					</TabsItem>
					<TabsItem selected={tab === 'active'} onClick={() => handleTabChange('active')}>
						{t('Active')}
					</TabsItem>
					<TabsItem selected={tab === 'deactivated'} onClick={() => handleTabChange('deactivated')}>
						{t('Deactivated')}
					</TabsItem>
				</Tabs>
				<PageContent>
					<UsersTable
						filteredUsersQueryResult={filteredUsersQueryResult}
						setUserFilters={setUserFilters}
						paginationData={paginationData}
						sortData={sortData}
						tab={tab}
						isSeatsCapExceeded={isSeatsCapExceeded}
						roleData={data}
						onReload={handleReload}
					/>
				</PageContent>
			</Page>
			{context && (
				<ContextualbarDialog>
					<Contextualbar>
						<ContextualbarHeader>
							{context === 'upgrade' && <ContextualbarIcon name='user-plus' />}
							<ContextualbarTitle>
								{context === 'info' && t('User_Info')}
								{context === 'edit' && t('Edit_User')}
								{(context === 'new' || context === 'created') && (
									<>
										<Icon name='user-plus' size={20} /> {t('New_user')}
									</>
								)}
								{context === 'invite' && t('Invite_Users')}
							</ContextualbarTitle>
							<ContextualbarClose onClick={() => router.navigate('/admin/users')} />
						</ContextualbarHeader>
						{context === 'info' && id && <AdminUserInfoWithData uid={id} onReload={handleReload} tab={tab} />}
						{context === 'edit' && id && (
							<AdminUserFormWithData uid={id} onReload={handleReload} context={context} roleData={data} roleError={error} />
						)}
						{!isRoutePrevented && context === 'new' && (
							<AdminUserForm onReload={handleReload} context={context} roleData={data} roleError={error} />
						)}
						{!isRoutePrevented && context === 'created' && id && <AdminUserCreated uid={id} />}
						{!isRoutePrevented && context === 'invite' && <AdminInviteUsers />}
						{isRoutePrevented && <AdminUserUpgrade />}
					</Contextualbar>
				</ContextualbarDialog>
			)}
		</Page>
	);
};

export default AdminUsersPage;
