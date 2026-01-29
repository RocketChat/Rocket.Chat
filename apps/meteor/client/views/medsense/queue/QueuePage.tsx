import {
    Badge,
    Box,
    Button,
    Callout,
    Modal,
    ModalHeader,
    ModalTitle,
    ModalClose,
    ModalContent,
    ModalFooter,
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
    TextAreaInput,
} from '@rocket.chat/fuselage';
import { useEndpoint, useRoute, useSetting, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { Page, PageContent, PageHeader } from '@rocket.chat/ui-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

const formatRequestStatus = (status?: string) => {
    if (!status) return '-';
    const map: Record<string, string> = {
        waiting_patient: 'Waiting for patient',
        ai_preassessment: 'AI pre-assessment',
        waiting_staff: 'Waiting for staff',
        ready_for_staff: 'Ready for staff',
        taken: 'Taken',
        closed: 'Closed',
    };
    if (map[status]) return map[status];
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const useStatusColors = (): Record<string, string> => {
    const settingValue = useSetting('Medsense_Queue_Status_Colors') as string | undefined;
    return useMemo(() => {
        const defaultColors: Record<string, string> = {
            waiting_patient: 'warning',
            ai_preassessment: 'secondary',
            waiting_staff: 'warning',
            ready_for_staff: 'featured',
            taken: 'primary',
            closed: 'secondary',
        };
        if (!settingValue) return defaultColors;
        try {
            return { ...defaultColors, ...JSON.parse(settingValue) };
        } catch {
            return defaultColors;
        }
    }, [settingValue]);
};

// ============================================================================
// WAITING QUEUE (requests.list)
// ============================================================================
export const WaitingQueueContent = ({
    requests,
    isLoading,
    refetch
}: {
    requests: any[];
    isLoading: boolean;
    refetch: () => void;
}): JSX.Element => {
    const t = useTranslation();
    const queryClient = useQueryClient();
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

    // Modal states
    const [previewRequest, setPreviewRequest] = useState<any>(null);
    const [declineRequest, setDeclineRequest] = useState<any>(null);
    const [declineMessage, setDeclineMessage] = useState('');
    const statusColors = useStatusColors();

    const takeAction = useEndpoint('POST', '/v1/medsense/request.take');
    const takeMutation = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => takeAction({ requestId }),
        onSuccess: () => {
            dispatchToastMessage({ type: 'success', message: t('Request_taken') });
            queryClient.invalidateQueries({ queryKey: ['waiting-queue'] });
            refetch();
        },
        onError: (error) => {
            const message = (error as any)?.error || (error as any)?.message || String(error);
            dispatchToastMessage({ type: 'error', message });
        },
    });

    const declineAction = useEndpoint('POST', '/v1/medsense/request.decline');
    const declineMutation = useMutation({
        mutationFn: async ({ requestId, message }: { requestId: string; message?: string }) =>
            declineAction({ requestId, message }),
        onSuccess: () => {
            dispatchToastMessage({ type: 'success', message: t('Request_declined') });
            setDeclineRequest(null);
            setDeclineMessage('');
            queryClient.invalidateQueries({ queryKey: ['waiting-queue'] });
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
        } catch { }
    };

    if (isLoading) {
        return <Box display='flex' justifyContent='center' p='x32'><Throbber size='x32' /></Box>;
    }

    if (!requests.length) {
        return (
            <States>
                <StatesIcon name='queue' />
                <StatesTitle>{t('Queue_is_empty')}</StatesTitle>
                <StatesSubtitle>{t('No pending requests')}</StatesSubtitle>
            </States>
        );
    }

    return (<>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('Patient')}</TableCell>
                    <TableCell>{t('Issue')}</TableCell>
                    <TableCell>{t('Status')}</TableCell>
                    <TableCell>{t('Room')}</TableCell>
                    <TableCell>{t('Waiting_Since')}</TableCell>
                    <TableCell>{t('Action')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {requests.map((request: any) => (
                    <TableRow key={request._id}>
                        <TableCell>{request.requestedByUsername || 'Unknown'}</TableCell>
                        <TableCell>{request.reason || '-'}</TableCell>
                        <TableCell>
                            <Tag variant={(statusColors[request.status] || 'secondary') as any}>{formatRequestStatus(request.status)}</Tag>
                        </TableCell>
                        <TableCell>{request.roomName || '-'}</TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell>
                            <Box display='flex' gap='x8' flexWrap='wrap'>
                                <Button small onClick={() => setPreviewRequest(request)}>
                                    {t('Preview')}
                                </Button>
                                <Button small primary onClick={() => handleTake(request._id, request.roomId)} disabled={takeMutation.isLoading} {...({ style: joinButtonStyle } as any)}>
                                    {t('Take')}
                                </Button>
                                <Button small danger onClick={() => setDeclineRequest(request)}>
                                    {t('Decline')}
                                </Button>
                            </Box>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        {/* Preview Modal */}
        {
            previewRequest && (
                <Modal>
                    <ModalHeader>
                        <ModalTitle>{t('Request_Preview')}</ModalTitle>
                        <ModalClose onClick={() => setPreviewRequest(null)} />
                    </ModalHeader>
                    <ModalContent>
                        <Box mb='x8'><b>{t('Patient')}:</b> {previewRequest.requestedByUsername || 'Unknown'}</Box>
                        <Box mb='x8'><b>{t('Issue')}:</b> {previewRequest.reason || '-'}</Box>
                        <Box mb='x8'><b>{t('Context_Summary')}:</b></Box>
                        <Box whiteSpace='pre-wrap' p='x8' bg='neutral-100' borderRadius='x4'>
                            {previewRequest.contextSummary || t('No summary available')}
                        </Box>
                    </ModalContent>
                    <ModalFooter>
                        <Button onClick={() => setPreviewRequest(null)}>{t('Close')}</Button>
                    </ModalFooter>
                </Modal>
            )
        }

        {/* Decline Modal */}
        {
            declineRequest && (
                <Modal>
                    <ModalHeader>
                        <ModalTitle>{t('Decline_Request')}</ModalTitle>
                        <ModalClose onClick={() => { setDeclineRequest(null); setDeclineMessage(''); }} />
                    </ModalHeader>
                    <ModalContent>
                        <Box mb='x8'>{t('Declining_request_for')}: <b>{declineRequest.requestedByUsername || 'Unknown'}</b></Box>
                        <TextAreaInput
                            placeholder={t('Reason_for_declining')}
                            value={declineMessage}
                            onChange={(e: any) => setDeclineMessage(e.target.value)}
                            rows={4}
                            w='full'
                        />
                    </ModalContent>
                    <ModalFooter justifyContent='space-between'>
                        <Button onClick={() => { setDeclineRequest(null); setDeclineMessage(''); }}>{t('Cancel')}</Button>
                        <Button danger onClick={() => declineMutation.mutate({ requestId: declineRequest._id, message: declineMessage })} disabled={declineMutation.isLoading}>
                            {t('Decline')}
                        </Button>
                    </ModalFooter>
                </Modal>
            )
        }
    </>
    );
};

// ============================================================================
// FOLLOWED QUEUE (requests.followed)
// ============================================================================
export const FollowedQueueContent = ({
    requests,
    isLoading,
    refetch
}: {
    requests: any[];
    isLoading: boolean;
    refetch: () => void;
}): JSX.Element => {
    const t = useTranslation();
    const queryClient = useQueryClient();
    const dispatchToastMessage = useToastMessageDispatch();
    const channelRoute = useRoute('channel');
    const groupRoute = useRoute('group');
    const directRoute = useRoute('direct');
    const formatDate = useFormatDate();
    const getRoomInfo = useEndpoint('GET', '/v1/rooms.info');

    const closeAction = useEndpoint('POST', '/v1/medsense/request.close');
    const closeMutation = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => closeAction({ requestId }),
        onSuccess: () => {
            dispatchToastMessage({ type: 'success', message: t('Request_closed') });
            queryClient.invalidateQueries({ queryKey: ['followed-queue'] });
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

    if (isLoading) {
        return <Box display='flex' justifyContent='center' p='x32'><Throbber size='x32' /></Box>;
    }

    if (!requests.length) {
        return (
            <States>
                <StatesIcon name='queue' />
                <StatesTitle>{t('No active chats')}</StatesTitle>
                <StatesSubtitle>{t('No followed requests')}</StatesSubtitle>
            </States>
        );
    }

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>{t('Patient')}</TableCell>
                    <TableCell>{t('Issue')}</TableCell>
                    <TableCell>{t('Taken by')}</TableCell>
                    <TableCell>{t('Taken at')}</TableCell>
                    <TableCell>{t('Action')}</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {requests.map((request: any) => (
                    <TableRow key={request._id}>
                        <TableCell>{request.requestedByUsername || 'Unknown'}</TableCell>
                        <TableCell>{request.reason || '-'}</TableCell>
                        <TableCell>{request.takenBy?.username || '-'}</TableCell>
                        <TableCell>{formatDate(request.takenAt)}</TableCell>
                        <TableCell>
                            <Box display='flex' gap='x16' flexWrap='wrap'>
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
                    <TableCell>{t('Room')}</TableCell>
                    <TableCell>{t('Taken by')}</TableCell>
                    <TableCell>{t('Closed by')}</TableCell>
                    <TableCell>{t('Closed at')}</TableCell>
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
        marginLeft: '8px',
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

    // FETCH DATA ONCE
    const getWaitingQueue = useEndpoint('GET', '/v1/medsense/request.list');
    const {
        data: waitingQueueData,
        isLoading: isLoadingWaiting,
        refetch: refetchWaiting
    } = useQuery({
        queryKey: ['waiting-queue', selectedPharmacy, pharmacyIds],
        queryFn: async () => {
            if (!selectedPharmacy) return { requests: [] };
            if (selectedPharmacy === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getWaitingQueue({ pharmacyId: id })));
                const requests = results.flatMap((result) => result.requests || []);
                return { requests };
            }
            return getWaitingQueue({ pharmacyId: selectedPharmacy });
        },
        enabled: !!selectedPharmacy && (selectedPharmacy === 'all' ? pharmacyIds.length > 0 : true),
        refetchInterval: 2000,
    });

    const waitingRequests = waitingQueueData?.requests || [];
    const waitingCount = waitingRequests.length;

    const getFollowedQueue = useEndpoint('GET', '/v1/medsense/request.followed');
    const {
        data: followedQueueData,
        isLoading: isLoadingFollowed,
        refetch: refetchFollowed
    } = useQuery({
        queryKey: ['followed-queue', selectedPharmacy, pharmacyIds],
        queryFn: async () => {
            if (!selectedPharmacy) return { requests: [] };
            if (selectedPharmacy === 'all') {
                const results = await Promise.all(pharmacyIds.map((id) => getFollowedQueue({ pharmacyId: id })));
                const requests = results.flatMap((result) => result.requests || []);
                return { requests };
            }
            return getFollowedQueue({ pharmacyId: selectedPharmacy });
        },
        enabled: !!selectedPharmacy && (selectedPharmacy === 'all' ? pharmacyIds.length > 0 : true),
        refetchInterval: 5000,
    });

    const followedRequests = followedQueueData?.requests || [];
    const followedCount = followedRequests.length;

    const queryClient = useQueryClient();

    return (
        <Box display='flex' flexDirection='column' w='full' h='full'>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb='x16'>
                <Tabs>
                    <TabsItem selected={tab === 'waiting'} onClick={() => setTab('waiting')}>
                        <Box display='flex' alignItems='center' gap='x32'>
                            <Box is='span'>{t('Waiting')}</Box>
                            {waitingCount > 0 && (
                                <Badge {...({ style: badgeStyle } as any)} variant='primary'>
                                    {waitingCount}
                                </Badge>
                            )}
                        </Box>
                    </TabsItem>
                    <TabsItem selected={tab === 'followed'} onClick={() => setTab('followed')}>
                        <Box display='flex' alignItems='center' gap='x32'>
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
                <WaitingQueueContent
                    requests={waitingRequests}
                    isLoading={isLoadingWaiting}
                    refetch={refetchWaiting}
                />
            ) : tab === 'followed' ? (
                <FollowedQueueContent
                    requests={followedRequests}
                    isLoading={isLoadingFollowed}
                    refetch={refetchFollowed}
                />
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
