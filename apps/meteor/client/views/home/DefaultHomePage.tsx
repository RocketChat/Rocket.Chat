import { Badge, Box, CardGroup, Tabs } from '@rocket.chat/fuselage';
import { PageScrollableContent, Page } from '@rocket.chat/ui-client';
import { useQuery } from '@tanstack/react-query';
import { useAtLeastOnePermission, useSetting, useTranslation, useRole, usePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import HomePageHeader from './HomePageHeader';
import AddUsersCard from './cards/AddUsersCard';
import CreateChannelsCard from './cards/CreateChannelsCard';
import CustomContentCard from './cards/CustomContentCard';
import DesktopAppsCard from './cards/DesktopAppsCard';
import DocumentationCard from './cards/DocumentationCard';
import JoinRoomsCard from './cards/JoinRoomsCard';
import MobileAppsCard from './cards/MobileAppsCard';
import { QueueContent } from '../medsense/queue/QueuePage';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];

type HomeTab = 'home' | 'queue';

const DefaultHomePage = (): ReactElement => {
    const t = useTranslation();
    const canAddUsers = usePermission('view-user-administration');
    const isAdmin = useRole('admin');
    const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
    const workspaceName = useSetting('Site_Name');
    const isCustomContentBodyEmpty = useSetting('Layout_Home_Body', '') === '';
    const isCustomContentVisible = useSetting('Layout_Home_Custom_Block_Visible', false);
    const canViewQueuePermission = usePermission('view-livechat-manager');
    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');
    const { data: pharmacyData } = useQuery({
        queryKey: ['home-pharmacies'],
        queryFn: async () => getPharmacies({}),
        enabled: true,
        retry: false,
    });
    const canViewQueue = canViewQueuePermission || (pharmacyData?.pharmacies?.length ?? 0) > 0;

    const pharmacyIds = (pharmacyData?.pharmacies || []).map((pharmacy: any) => pharmacy._id);
    const getWaitingQueue = useEndpoint('GET', '/v1/medsense/request.list');
    const { data: pendingCountData } = useQuery({
        queryKey: ['medsense-waiting-count', pharmacyIds],
        queryFn: async () => {
            if (!canViewQueue || pharmacyIds.length === 0) {
                return { count: 0 };
            }
            const results = await Promise.all(
                pharmacyIds.map((pharmacyId: string) => getWaitingQueue({ pharmacyId })),
            );
            const count = results.reduce((total, result) => total + (result.requests?.length ?? 0), 0);
            return { count };
        },
        enabled: canViewQueue && pharmacyIds.length > 0,
        refetchInterval: 5000,
    });
    const pendingCount = pendingCountData?.count ?? 0;

    const getFollowedQueue = useEndpoint('GET', '/v1/medsense/request.followed');
    const { data: followedCountData } = useQuery({
        queryKey: ['medsense-followed-count', pharmacyIds],
        queryFn: async () => {
            if (!canViewQueue || pharmacyIds.length === 0) {
                return { count: 0 };
            }
            const results = await Promise.all(
                pharmacyIds.map((pharmacyId: string) => getFollowedQueue({ pharmacyId })),
            );
            const count = results.reduce((total, result) => total + (result.requests?.length ?? 0), 0);
            return { count };
        },
        enabled: canViewQueue && pharmacyIds.length > 0,
        refetchInterval: 5000,
    });
    const followedCount = followedCountData?.count ?? 0;
    const badgeStyle = {
        fontSize: '0.75rem',
        minWidth: '20px',
        height: '20px',
        padding: '0 6px',
        borderRadius: '999px',
        fontWeight: 700,
        lineHeight: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '8px',
    };

    const [tab, setTab] = useState<HomeTab>('home');
    const didSetInitialTab = useRef(false);

    useEffect(() => {
        if (!didSetInitialTab.current && canViewQueue) {
            setTab('queue');
            didSetInitialTab.current = true;
            return;
        }
        if (!canViewQueue && tab === 'queue') {
            setTab('home');
        }
    }, [canViewQueue, tab]);

    return (
        <Page color='default' background='tint'>
            <HomePageHeader />
            {canViewQueue && (
                <Box pi='x16' pb='x8'>
                    <Tabs>
                        <Tabs.Item selected={tab === 'home'} onClick={() => setTab('home')}>
                            {t('Home')}
                        </Tabs.Item>
                        <Tabs.Item selected={tab === 'queue'} onClick={() => setTab('queue')}>
                            <Box display='flex' alignItems='center' gap='x32'>
                                <Box is='span'>Chat Queue</Box>
                                {pendingCount + followedCount > 0 && (
                                    <Badge {...({ style: badgeStyle } as any)} variant='primary'>
                                        {pendingCount + followedCount}
                                    </Badge>
                                )}
                            </Box>
                        </Tabs.Item>
                    </Tabs>
                </Box>
            )}
            <PageScrollableContent>
                {tab === 'queue' && canViewQueue ? (
                    <QueueContent />
                ) : (
                    <>
                        <Box is='h2' fontScale='h1' mb={20}>
                            {t('Welcome_to_workspace', { Site_Name: workspaceName || 'MedSense' })}
                        </Box>
                        <Box is='h3' fontScale='h3' mb={16}>
                            {t('Some_ideas_to_get_you_started')}
                        </Box>
                        <Box mi='neg-x8'>
                            <CardGroup wrap stretch>
                                {canAddUsers && <AddUsersCard />}
                                {canCreateChannel && <CreateChannelsCard />}
                                <JoinRoomsCard />
                                <MobileAppsCard />
                                <DesktopAppsCard />
                                <DocumentationCard />
                                {(isAdmin || (isCustomContentVisible && !isCustomContentBodyEmpty)) && <CustomContentCard />}
                            </CardGroup>
                        </Box>
                    </>
                )}
            </PageScrollableContent>
        </Page>
    );
};

export default DefaultHomePage;
