import {
    Badge,
    Box,
    Button,
    Callout,
    Select,
    States,
    StatesIcon,
    StatesSubtitle,
    StatesTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    TabsItem,
    Throbber,
    Tag,
} from '@rocket.chat/fuselage';
import { useEndpoint, useRoute, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { Page, PageContent, PageHeader } from '@rocket.chat/ui-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

const useFormatDate = () => {
    return useCallback((value?: string | Date) => {
        if (!value) {
            return '-';
        }
        const d = value instanceof Date ? value : new Date(value);
        return d.toLocaleString();
    }, []);
};

// ============================================================================
// WAITING QUEUE (requests.list)
// ============================================================================
export const WaitingQueueContent = ({ pharmacyId, pharmacyIds }: { pharmacyId: string; pharmacyIds: string[] }): JSX.Element => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const channelRoute = useRoute('channel');
    const groupRoute = useRoute('group');
    const directRoute = useRoute('direct');
    const formatDate = useFormatDate();
    const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');
    const joinButtonStyle = {
        backgroundColor: '#2e8540',
        borderColor: '#2e8540',
        color: '#ffffff',
    };

    const getWaitingQueue = useEndpoint('GET', '/v1/medsense/request.list');
    const { data: queueData, isLoading: isLoadingQueue, refetch } = useQuery({
        queryKey: ['waiting-queue', pharmacyId, pharmacyIds],
        queryFn: async () => {
            if (!pharmacyId) return { requests: [] };
            if (pharmacyId === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getWaitingQueue({ pharmacyId: id })));
                const requests = results.flatMap((result) => result.requests || []);
                return { requests };
            }
            return getWaitingQueue({ pharmacyId });
        },
        enabled: !!pharmacyId,
        refetchInterval: 5000,
    });

    const takeAction = useEndpoint('POST', '/v1/medsense/request.take');
    const takeMutation = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => takeAction({ requestId }),
        onSuccess: () => {
            dispatchToastMessage({ type: 'success', message: t('Request_taken') });
            refetch();
        },
        onError: (error) => {
            const message = (error as any)?.error || (error as any)?.message || String(error);
            dispatchToastMessage({ type: 'error', message });
        },
    });

    const openRoom = async (roomId: string) => {
        try {
            const info = await getRoomInfo({ roomId });
            const room = info?.room;
            if (!room) return;
            if (room.t === 'p') groupRoute.push({ name: room.name });
            else if (room.t === 'c') channelRoute.push({ name: room.name });
            else if (room.t === 'd') {
                const username = room.usernames?.[0];
                if (username) directRoute.push({ username });
            }
        } catch { }
    };

    const handleTake = async (requestId: string, roomId: string) => {
        try {
            await takeMutation.mutateAsync({ requestId });
            await openRoom(roomId);
        } catch {
            // Toast already handled in onError; prevent unhandled promise rejection.
        }
    };

    if (isLoadingQueue) {
        return <Box display='flex' justifyContent='center' p='x32'><Throbber size='x32' /></Box>;
    }

    if (!queueData?.requests.length) {
        return (
            <States>
                <StatesIcon name='queue' />
                <StatesTitle>{t('Queue_is_empty')}</StatesTitle>
                <StatesSubtitle>{t('No_pending_requests')}</StatesSubtitle>
            </States>
        );
    }

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('Patient')}</TableCell>
                    <TableCell>{t('Issue')}</TableCell>
                    <TableCell>{t('Room')}</TableCell>
                    <TableCell>{t('Waiting_Since')}</TableCell>
                    <TableCell>{t('Action')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {queueData.requests.map((request: any) => (
                    <TableRow key={request._id}>
                        <TableCell>{request.requestedByUsername || 'Unknown'}</TableCell>
                        <TableCell>{request.reason || '-'}</TableCell>
                        <TableCell>{request.roomName || '-'}</TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell>
                            <Button small primary onClick={() => handleTake(request._id, request.roomId)} disabled={takeMutation.isLoading} {...({ style: joinButtonStyle } as any)}>
                                {t('Take')}
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ============================================================================
// FOLLOWED QUEUE (requests.followed)
// ============================================================================
export const FollowedQueueContent = ({ pharmacyId, pharmacyIds }: { pharmacyId: string; pharmacyIds: string[] }): JSX.Element => {
    const t = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const channelRoute = useRoute('channel');
    const groupRoute = useRoute('group');
    const directRoute = useRoute('direct');
    const formatDate = useFormatDate();
    const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

    const getFollowedQueue = useEndpoint('GET', '/v1/medsense/request.followed');
    const { data: queueData, isLoading: isLoadingQueue, refetch } = useQuery({
        queryKey: ['followed-queue', pharmacyId, pharmacyIds],
        queryFn: async () => {
            if (!pharmacyId) return { requests: [] };
            if (pharmacyId === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getFollowedQueue({ pharmacyId: id })));
                const requests = results.flatMap((result) => result.requests || []);
                return { requests };
            }
            return getFollowedQueue({ pharmacyId });
        },
        enabled: !!pharmacyId,
        refetchInterval: 5000,
    });

    const closeAction = useEndpoint('POST', '/v1/medsense/request.close');
    const closeMutation = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => closeAction({ requestId }),
        onSuccess: () => {
            dispatchToastMessage({ type: 'success', message: t('Request_closed') });
            refetch();
        },
        onError: (error) => {
            const message = (error as any)?.error || (error as any)?.message || String(error);
            dispatchToastMessage({ type: 'error', message });
        },
    });

    const openRoom = async (roomId: string) => {
        try {
            const info = await getRoomInfo({ roomId });
            const room = info?.room;
            if (!room) return;
            if (room.t === 'p') groupRoute.push({ name: room.name });
            else if (room.t === 'c') channelRoute.push({ name: room.name });
            else if (room.t === 'd') {
                const username = room.usernames?.[0];
                if (username) directRoute.push({ username });
            }
        } catch { }
    };

    if (isLoadingQueue) {
        return <Box display='flex' justifyContent='center' p='x32'><Throbber size='x32' /></Box>;
    }

    if (!queueData?.requests.length) {
        return (
            <States>
                <StatesIcon name='queue' />
                <StatesTitle>{t('No_active_chats')}</StatesTitle>
                <StatesSubtitle>{t('No_followed_requests')}</StatesSubtitle>
            </States>
        );
    }

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('Patient')}</TableCell>
                    <TableCell>{t('Issue')}</TableCell>
                    <TableCell>{t('Taken_By')}</TableCell>
                    <TableCell>{t('Taken_At')}</TableCell>
                    <TableCell>{t('Action')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {queueData.requests.map((request: any) => (
                    <TableRow key={request._id}>
                        <TableCell>{request.requestedByUsername || 'Unknown'}</TableCell>
                        <TableCell>{request.reason || '-'}</TableCell>
                        <TableCell>{request.takenBy?.username || '-'}</TableCell>
                        <TableCell>{formatDate(request.takenAt)}</TableCell>
                        <TableCell>
                            <Box display='flex' gap='x8'>
                                <Button small onClick={() => openRoom(request.roomId)}>{t('View')}</Button>
                                <Button small danger onClick={() => closeMutation.mutate({ requestId: request._id })} disabled={closeMutation.isLoading}>
                                    {t('Close')}
                                </Button>
                            </Box>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ============================================================================
// HISTORY QUEUE (requests.history)
// ============================================================================
export const HistoryQueueContent = ({ pharmacyId, pharmacyIds }: { pharmacyId: string; pharmacyIds: string[] }): JSX.Element => {
    const t = useTranslation();
    const formatDate = useFormatDate();

    const getHistory = useEndpoint('GET', '/v1/medsense/request.history');
    const { data: historyData, isLoading } = useQuery({
        queryKey: ['history-queue', pharmacyId, pharmacyIds],
        queryFn: async () => {
            if (!pharmacyId) return { requests: [] };
            if (pharmacyId === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getHistory({ pharmacyId: id })));
                const requests = results.flatMap((result) => result.requests || []);
                return { requests };
            }
            return getHistory({ pharmacyId });
        },
        enabled: !!pharmacyId,
    });

    if (isLoading) {
        return <Box display='flex' justifyContent='center' p='x32'><Throbber size='x32' /></Box>;
    }

    if (!historyData?.requests.length) {
        return (
            <States>
                <StatesIcon name='history' />
                <StatesTitle>{t('No_history')}</StatesTitle>
            </States>
        );
    }

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('Patient')}</TableCell>
                    <TableCell>{t('Issue')}</TableCell>
                    <TableCell>{t('In_Room')}</TableCell>
                    <TableCell>{t('Taken_By')}</TableCell>
                    <TableCell>{t('Closed_By')}</TableCell>
                    <TableCell>{t('Closed_At')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {historyData.requests.map((request: any) => (
                    <TableRow key={request._id}>
                        <TableCell>{request.requestedByUsername || 'Unknown'}</TableCell>
                        <TableCell>{request.reason || '-'}</TableCell>
                        <TableCell>{request.roomName || '-'}</TableCell>
                        <TableCell>{request.takenBy?.username || '-'}</TableCell>
                        <TableCell>{request.closedBy?.username || '-'}</TableCell>
                        <TableCell>{formatDate(request.closedAt)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

// ============================================================================
// MAIN PAGE
// ============================================================================
export const QueueContent = (): JSX.Element => {
    const t = useTranslation();
    const [tab, setTab] = useState<'waiting' | 'followed' | 'history'>('waiting');
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
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
    };

    const getPharmacies = useEndpoint('GET', '/v1/medsense/pharmacies.list');
    const { data: pharmacyData, isLoading: isLoadingPharmacies } = useQuery({
        queryKey: ['my-pharmacies'],
        queryFn: async () => getPharmacies({}),
    });

    const pharmacyIds = useMemo(
        () => (pharmacyData?.pharmacies ? pharmacyData.pharmacies.map((p: any) => String(p._id)) : []),
        [pharmacyData],
    );
    const pharmacyOptions = useMemo(
        () => {
            if (!pharmacyData?.pharmacies?.length) return [];
            const options = pharmacyData.pharmacies.map((p: any) => [p._id, p.name]);
            return [['all', t('All')], ...options];
        },
        [pharmacyData, t],
    );

    useEffect(() => {
        if (!selectedPharmacy && pharmacyOptions.length > 0) {
            setSelectedPharmacy('all');
        }
    }, [pharmacyOptions, selectedPharmacy]);

    // Live Badges
    const getWaitingQueue = useEndpoint('GET', '/v1/medsense/request.list');
    const { data: countData } = useQuery({
        queryKey: ['waiting-count', selectedPharmacy],
        queryFn: async () => {
            if (!selectedPharmacy) return { count: 0 };
            if (selectedPharmacy === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getWaitingQueue({ pharmacyId: id })));
                const count = results.reduce((total, result) => total + (result.requests?.length ?? 0), 0);
                return { count };
            }
            const result = await getWaitingQueue({ pharmacyId: selectedPharmacy });
            return { count: result.requests?.length ?? 0 };
        },
        enabled: !!selectedPharmacy && (selectedPharmacy === 'all' ? pharmacyIds.length > 0 : true),
        refetchInterval: 5000,
    });
    const waitingCount = countData?.count ?? 0;

    const getFollowedQueue = useEndpoint('GET', '/v1/medsense/request.followed');
    const { data: followedCountData } = useQuery({
        queryKey: ['followed-count', selectedPharmacy],
        queryFn: async () => {
            if (!selectedPharmacy) return { count: 0 };
            if (selectedPharmacy === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getFollowedQueue({ pharmacyId: id })));
                const count = results.reduce((total, result) => total + (result.requests?.length ?? 0), 0);
                return { count };
            }
            const result = await getFollowedQueue({ pharmacyId: selectedPharmacy });
            return { count: result.requests?.length ?? 0 };
        },
        enabled: !!selectedPharmacy && (selectedPharmacy === 'all' ? pharmacyIds.length > 0 : true),
        refetchInterval: 5000,
    });
    const followedCount = followedCountData?.count ?? 0;

    return (
        <Box display='flex' flexDirection='column' w='full' h='full'>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb='x16'>
                <Tabs>
                    <TabsItem selected={tab === 'waiting'} onClick={() => setTab('waiting')}>
                        <Box display='flex' alignItems='center' gap='x12'>
                            <Box is='span'>{t('Waiting')}</Box>
                            {waitingCount > 0 && (
                                <Badge {...({ style: badgeStyle } as any)} variant='primary'>
                                    {waitingCount}
                                </Badge>
                            )}
                        </Box>
                    </TabsItem>
                    <TabsItem selected={tab === 'followed'} onClick={() => setTab('followed')}>
                        <Box display='flex' alignItems='center' gap='x12'>
                            <Box is='span'>{t('Followed')}</Box>
                            {followedCount > 0 && (
                                <Badge {...({ style: badgeStyle } as any)} variant='primary'>
                                    {followedCount}
                                </Badge>
                            )}
                        </Box>
                    </TabsItem>
                    <TabsItem selected={tab === 'history'} onClick={() => setTab('history')}>
                        {t('History')}
                    </TabsItem>
                </Tabs>
                <Box minWidth='x200'>
                    <Select
                        options={pharmacyOptions}
                        value={selectedPharmacy}
                        onChange={(val) => setSelectedPharmacy(String(val))}
                        placeholder={t('Select_Pharmacy')}
                        disabled={isLoadingPharmacies}
                    />
                </Box>
            </Box>

            {!selectedPharmacy ? (
                <Callout type='info'>{t('Please_select_a_pharmacy')}</Callout>
            ) : tab === 'waiting' ? (
                <WaitingQueueContent pharmacyId={selectedPharmacy} pharmacyIds={pharmacyIds} />
            ) : tab === 'followed' ? (
                <FollowedQueueContent pharmacyId={selectedPharmacy} pharmacyIds={pharmacyIds} />
            ) : (
                <HistoryQueueContent pharmacyId={selectedPharmacy} pharmacyIds={pharmacyIds} />
            )}
        </Box>
    );
};

const QueuePage = (): JSX.Element => {
    const t = useTranslation();
    return (
        <Page>
            <PageHeader title={t('Queue_Dashboard')} />
            <PageContent>
                <QueueContent />
            </PageContent>
        </Page>
    );
};

export default QueuePage;
