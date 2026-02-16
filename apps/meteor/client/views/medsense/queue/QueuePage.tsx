import {
	Badge,
	Box,
	Button,
	IconButton,
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
	Pagination,
} from '@rocket.chat/fuselage';
import { useEndpoint, useRoute, useSetting, useToastMessageDispatch, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { GenericMenu, Page, PageContent, PageHeader, usePagination } from '@rocket.chat/ui-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import PatientUserAutoComplete from './PatientUserAutoComplete';

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

const formatInterventionType = (type?: string) => {
	if (!type) return '-';
	return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
	refetch,
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
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	// Modal states
	const [previewRequest, setPreviewRequest] = useState<any>(null);
	const [declineRequest, setDeclineRequest] = useState<any>(null);
	const [declineMessage, setDeclineMessage] = useState('');
	const statusColors = useStatusColors();
	const getRoomSessionInfo = useEndpoint('GET', '/v1/medsense/room.sessionInfo');

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
		mutationFn: async ({ requestId, message }: { requestId: string; message?: string }) => declineAction({ requestId, message }),
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

	const { data: previewSessionInfo } = useQuery({
		queryKey: ['request-preview-room-context', previewRequest?.roomId],
		queryFn: async () => {
			if (!previewRequest?.roomId) return null;
			return getRoomSessionInfo({ roomId: previewRequest.roomId });
		},
		enabled: !!previewRequest?.roomId,
	});

	const previewRoomContextSummary = useMemo(() => {
		const summaries = previewSessionInfo?.sessionInfo?.roomContextSummaries;
		if (!Array.isArray(summaries) || summaries.length === 0) {
			return '';
		}
		const latest = summaries[summaries.length - 1];
		return latest?.summary || '';
	}, [previewSessionInfo]);

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
		} catch {}
	};

	const handleTake = async (requestId: string, roomId: string) => {
		try {
			await takeMutation.mutateAsync({ requestId });
			await openRoom(roomId);
		} catch {}
	};

	if (isLoading) {
		return (
			<Box display='flex' justifyContent='center' p='x32'>
				<Throbber size='x32' />
			</Box>
		);
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

	return (
		<>
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
					{requests.slice(current * itemsPerPage, (current + 1) * itemsPerPage).map((request: any) => (
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
									<Button
										small
										primary
										onClick={() => handleTake(request._id, request.roomId)}
										disabled={takeMutation.isLoading}
										{...({ style: joinButtonStyle } as any)}
									>
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
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={requests.length}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
				{...paginationProps}
			/>

			{/* Preview Modal */}
			{previewRequest && (
				<Modal>
					<ModalHeader>
						<ModalTitle>{t('Request_Preview')}</ModalTitle>
						<ModalClose onClick={() => setPreviewRequest(null)} />
					</ModalHeader>
					<ModalContent>
						<Box mb='x8'>
							<b>{t('Patient')}:</b> {previewRequest.requestedByUsername || 'Unknown'}
						</Box>
						<Box mb='x8'>
							<b>{t('Issue')}:</b> {previewRequest.reason || '-'}
						</Box>
						<Box mb='x8'>
							<b>{t('Context_Summary')}:</b>
						</Box>
						<Box whiteSpace='pre-wrap' p='x8' bg='neutral-100' borderRadius='x4'>
							{previewRoomContextSummary || t('No_summary_available')}
						</Box>
					</ModalContent>
					<ModalFooter>
						<Button onClick={() => setPreviewRequest(null)}>{t('Close')}</Button>
					</ModalFooter>
				</Modal>
			)}

			{/* Decline Modal */}
			{declineRequest && (
				<Modal>
					<ModalHeader>
						<ModalTitle>{t('Decline_Request')}</ModalTitle>
						<ModalClose
							onClick={() => {
								setDeclineRequest(null);
								setDeclineMessage('');
							}}
						/>
					</ModalHeader>
					<ModalContent>
						<Box mb='x8'>
							{t('Declining_request_for')}: <b>{declineRequest.requestedByUsername || 'Unknown'}</b>
						</Box>
						<TextAreaInput
							placeholder={t('Reason_for_declining')}
							value={declineMessage}
							onChange={(e: any) => setDeclineMessage(e.target.value)}
							rows={4}
							w='full'
						/>
					</ModalContent>
					<ModalFooter justifyContent='space-between'>
						<Button
							onClick={() => {
								setDeclineRequest(null);
								setDeclineMessage('');
							}}
						>
							{t('Cancel')}
						</Button>
						<Button
							danger
							onClick={() => declineMutation.mutate({ requestId: declineRequest._id, message: declineMessage })}
							disabled={declineMutation.isLoading}
						>
							{t('Decline')}
						</Button>
					</ModalFooter>
				</Modal>
			)}
		</>
	);
};

// ============================================================================
// FOLLOWED QUEUE (requests.followed)
// ============================================================================
export const FollowedQueueContent = ({
	requests,
	isLoading,
	refetch,
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
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

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
		} catch {}
	};

	if (isLoading) {
		return (
			<Box display='flex' justifyContent='center' p='x32'>
				<Throbber size='x32' />
			</Box>
		);
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
		<>
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
					{requests.slice(current * itemsPerPage, (current + 1) * itemsPerPage).map((request: any) => (
						<TableRow key={request._id}>
							<TableCell>{request.requestedByUsername || 'Unknown'}</TableCell>
							<TableCell>{request.reason || '-'}</TableCell>
							<TableCell>{request.takenBy?.username || '-'}</TableCell>
							<TableCell>{formatDate(request.takenAt)}</TableCell>
							<TableCell>
								<Box display='flex' gap='x8' flexWrap='wrap'>
									<Button small onClick={() => openRoom(request.roomId)}>
										{t('View')}
									</Button>
									<Button small danger onClick={() => closeMutation.mutate({ requestId: request._id })} disabled={closeMutation.isLoading}>
										Close Session
									</Button>
								</Box>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={requests.length}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
				{...paginationProps}
			/>
		</>
	);
};

// ============================================================================
// HISTORY QUEUE (requests.history)
// ============================================================================
export const HistoryQueueContent = ({ pharmacyId, pharmacyIds }: { pharmacyId: string; pharmacyIds: string[] }): JSX.Element => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

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
		return (
			<Box display='flex' justifyContent='center' p='x32'>
				<Throbber size='x32' />
			</Box>
		);
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
		<>
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
					{historyData.requests.slice(current * itemsPerPage, (current + 1) * itemsPerPage).map((request: any) => (
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
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={historyData.requests.length}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
				{...paginationProps}
			/>
		</>
	);
};

// ============================================================================
// INTERVENTIONS QUEUE (interventions.byPatient)
// ============================================================================
const InterventionActionsMenu = ({ onViewDetails, onAddNote }: { onViewDetails: () => void; onAddNote: () => void }): JSX.Element => {
	const t = useTranslation();

	const menuItems = useMemo(
		() => [
			{
				id: 'view-details',
				icon: 'eye',
				content: t('View_details'),
				onClick: onViewDetails,
			},
			{
				id: 'add-note',
				icon: 'edit',
				content: t('Add_note'),
				onClick: onAddNote,
			},
		],
		[onAddNote, onViewDetails, t],
	);

	return <GenericMenu items={menuItems} placement='bottom-end' />;
};

export const InterventionsQueueContent = ({ pharmacyId }: { pharmacyId: string }): JSX.Element => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined);
	const [selectedPatient, setSelectedPatient] = useState<{ _id: string; username: string; name?: string } | null>(null);
	const [modalState, setModalState] = useState<{ interventionId: string; focusAddNote: boolean } | null>(null);

	const getInterventionsByPatient = useEndpoint('GET', '/v1/medsense/interventions.byPatient');

	useEffect(() => {
		setSelectedPatientId(undefined);
		setSelectedPatient(null);
		setModalState(null);
		setCurrent(0);
	}, [pharmacyId, setCurrent]);

	const {
		data: interventionsData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['interventions-by-patient-queue', pharmacyId, selectedPatientId],
		queryFn: async () => {
			if (!selectedPatientId) {
				return { interventions: [] };
			}

			const queryParams: { patientUserId: string; pharmacyId?: string } = { patientUserId: selectedPatientId };
			if (pharmacyId && pharmacyId !== 'all') {
				queryParams.pharmacyId = pharmacyId;
			}

			return getInterventionsByPatient(queryParams);
		},
		enabled: Boolean(pharmacyId) && Boolean(selectedPatientId),
	});

	const interventions = interventionsData?.interventions || [];
	const selectedPatientLabel = selectedPatient
		? selectedPatient.name
			? `${selectedPatient.name} (@${selectedPatient.username})`
			: selectedPatient.username
		: '';
	const selectedPatientWidthCh = Math.min(Math.max(selectedPatientLabel.length, 12), 32);

	if (!pharmacyId) {
		return <Callout type='info'>{t('Please_select_a_pharmacy')}</Callout>;
	}

	return (
		<>
			<Box display='flex' alignItems='center' gap='x16' mb='x16' flexWrap='wrap'>
				<PatientUserAutoComplete
					pharmacyId={pharmacyId}
					value={selectedPatientId}
					onChange={(user) => {
						setSelectedPatientId(user?._id);
						setSelectedPatient(user);
						setCurrent(0);
					}}
					placeholder={t('Select_Patient')}
					style={{
						width: selectedPatientId ? `calc(${selectedPatientWidthCh}ch + 2.75rem)` : '360px',
						maxWidth: '100%',
					}}
				/>
				{selectedPatientId && (
					<IconButton
						icon='cross'
						small
						secondary
						aria-label={t('Reset')}
						title={t('Reset')}
						onClick={() => {
							setSelectedPatientId(undefined);
							setSelectedPatient(null);
							setModalState(null);
							setCurrent(0);
						}}
					/>
				)}
			</Box>

			{!selectedPatientId ? (
				<Callout type='info'>{t('No_patient_selected')}</Callout>
			) : isLoading ? (
				<Box display='flex' justifyContent='center' p='x32'>
					<Throbber size='x32' />
				</Box>
			) : !interventions.length ? (
				<States>
					<StatesIcon name='document-eye' />
					<StatesTitle>{t('No_interventions_for_selected_patient')}</StatesTitle>
				</States>
			) : (
				<>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>{t('Patient')}</TableCell>
								<TableCell>{t('Type')}</TableCell>
								<TableCell>{t('Initial_Notes')}</TableCell>
								<TableCell>{t('Created_By')}</TableCell>
								<TableCell>{t('Created_At')}</TableCell>
								<TableCell>{t('Action')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{interventions.slice(current * itemsPerPage, (current + 1) * itemsPerPage).map((item: any) => (
								<TableRow key={item._id}>
									<TableCell>{selectedPatient?.name || selectedPatient?.username || 'Unknown'}</TableCell>
									<TableCell>{formatInterventionType(item.type)}</TableCell>
									<TableCell>
										<Box
											is='span'
											title={item.notes || '-'}
											style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px', display: 'block' }}
										>
											{item.notes || '-'}
										</Box>
									</TableCell>
									<TableCell>{item.createdBy?.username || '-'}</TableCell>
									<TableCell>{formatDate(item.createdAt)}</TableCell>
									<TableCell>
										<InterventionActionsMenu
											onViewDetails={() => setModalState({ interventionId: item._id, focusAddNote: false })}
											onAddNote={() => setModalState({ interventionId: item._id, focusAddNote: true })}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={interventions.length}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}

			{modalState && (
				<InterventionDetailsModal
					interventionId={modalState.interventionId}
					focusAddNote={modalState.focusAddNote}
					onClose={() => {
						setModalState(null);
						refetch();
					}}
				/>
			)}
		</>
	);
};

const InterventionDetailsModal = ({
	interventionId,
	onClose,
	focusAddNote = false,
}: {
	interventionId: string;
	onClose: () => void;
	focusAddNote?: boolean;
}) => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const dispatchToastMessage = useToastMessageDispatch();
	const [noteText, setNoteText] = useState('');

	const getInfo = useEndpoint('GET', '/v1/medsense/interventions.info');
	const {
		data: infoData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ['intervention-info', interventionId],
		queryFn: async () => getInfo({ interventionId }),
		refetchInterval: 5000,
	});

	const addNoteReq = useEndpoint('POST', '/v1/medsense/interventions.note.add');
	const addNoteMutation = useMutation({
		mutationFn: async () => addNoteReq({ interventionId, text: noteText }),
		onSuccess: () => {
			setNoteText('');
			refetch();
			dispatchToastMessage({ type: 'success', message: t('Note_added') });
		},
		onError: (error) => dispatchToastMessage({ type: 'error', message: String(error) }),
	});

	const intervention = infoData?.intervention;
	const notes = infoData?.notes || [];

	if (isLoading) {
		return (
			<Modal>
				<ModalContent>
					<Throbber />
				</ModalContent>
			</Modal>
		);
	}

	if (!intervention) {
		return (
			<Modal>
				<ModalContent>Not Found</ModalContent>
				<ModalFooter>
					<Button onClick={onClose}>{t('Close')}</Button>
				</ModalFooter>
			</Modal>
		);
	}

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Intervention_Details')}</ModalTitle>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Box mb='x16'>
					<Box>
						<b>{t('Type')}:</b> {formatInterventionType(intervention.type)}
					</Box>
					<Box>
						<b>{t('Created_By')}:</b> {intervention.createdBy?.username || '-'}
					</Box>
					<Box>
						<b>{t('Created_At')}:</b> {formatDate(intervention.createdAt)}
					</Box>
					<Box mt='x8'>
						<b>{t('Initial_Notes')}:</b>
					</Box>
					<Box p='x8' borderWidth='default' borderColor='neutral-300' borderRadius='x4' mb='x8'>
						{intervention.notes || '-'}
					</Box>
				</Box>

				<Box is='h4' fontScale='h4' mb='x8'>
					{t('Notes_History')}
				</Box>
				<Box maxHeight='x300' overflowY='auto' mb='x16' borderWidth='default' borderColor='neutral-300' borderRadius='x4' p='x8'>
					{notes.length === 0 && <Box color='hint'>{t('No_notes_yet')}</Box>}
					{notes.map((note: any) => (
						<Box key={note._id} mb='x8' pb='x8' borderBlockEndWidth='default' borderBlockEndColor='neutral-200'>
							<Box display='flex' justifyContent='space-between'>
								<b>{note.authorUsername || '-'}</b>
								<Box color='hint' fontSize='x12'>
									{formatDate(note.createdAt)}
								</Box>
							</Box>
							<Box>{note.text}</Box>
						</Box>
					))}
				</Box>

				<Box mb='x8' p='x8' borderWidth='default' borderColor='neutral-300' borderRadius='x4'>
					<Box display='flex' justifyContent='space-between' mb='x4'>
						<Box fontWeight='bold' color='default'>
							{t('New_Note')}
						</Box>
					</Box>
					<Box display='flex' gap='x8'>
						<TextAreaInput
							autoFocus={focusAddNote}
							placeholder={t('Add_a_note')}
							value={noteText}
							onChange={(e) => setNoteText(e.currentTarget.value)}
							rows={2}
							flexGrow={1}
						/>
						<Button primary onClick={() => addNoteMutation.mutate()} disabled={!noteText.trim() || addNoteMutation.isLoading}>
							{t('Add')}
						</Button>
					</Box>
				</Box>
			</ModalContent>
			<ModalFooter>
				<Button onClick={onClose}>{t('Close')}</Button>
			</ModalFooter>
		</Modal>
	);
};

// ============================================================================
// MAIN PAGE
// ============================================================================
export const QueueContent = (): JSX.Element => {
	const t = useTranslation();
	const canViewRequest = usePermission('medsense-view-request');
	const [tab, setTab] = useState<'waiting' | 'followed' | 'history' | 'interventions'>('waiting');
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
	const pharmacyOptions = useMemo(() => {
		if (!pharmacyData?.pharmacies?.length) return [];
		const options = pharmacyData.pharmacies.map((p: any) => [p._id, p.name]);
		return [['all', t('All')], ...options];
	}, [pharmacyData, t]);

	useEffect(() => {
		if (!selectedPharmacy && pharmacyOptions.length > 0) {
			setSelectedPharmacy('all');
		}
	}, [pharmacyOptions, selectedPharmacy]);

	useEffect(() => {
		if (tab === 'interventions' && !canViewRequest) {
			setTab('waiting');
		}
	}, [canViewRequest, tab]);

	const getWaitingQueue = useEndpoint('GET', '/v1/medsense/request.list');
	const {
		data: waitingQueueData,
		isLoading: isLoadingWaiting,
		refetch: refetchWaiting,
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
		refetch: refetchFollowed,
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

	useQueryClient();

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
					{canViewRequest && (
						<TabsItem selected={tab === 'interventions'} onClick={() => setTab('interventions')}>
							{t('Interventions')}
						</TabsItem>
					)}
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
				<WaitingQueueContent requests={waitingRequests} isLoading={isLoadingWaiting} refetch={refetchWaiting} />
			) : tab === 'followed' ? (
				<FollowedQueueContent requests={followedRequests} isLoading={isLoadingFollowed} refetch={refetchFollowed} />
			) : tab === 'history' ? (
				<HistoryQueueContent pharmacyId={selectedPharmacy} pharmacyIds={pharmacyIds} />
			) : (
				<InterventionsQueueContent pharmacyId={selectedPharmacy} />
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
