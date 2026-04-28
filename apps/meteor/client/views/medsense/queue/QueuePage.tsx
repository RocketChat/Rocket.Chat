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
	TextInput,
	Field,
	FieldLabel,
	FieldRow,
	Tabs,
	TabsItem,
	Throbber,
	Tag,
	TextAreaInput,
	Pagination,
} from '@rocket.chat/fuselage';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { GenericMenu, Page, PageContent, PageHeader, usePagination } from '@rocket.chat/ui-client';
import { useEndpoint, useSetting, useToastMessageDispatch, useTranslation, usePermission } from '@rocket.chat/ui-contexts';
import { PhoneNumberInput } from '@rocket.chat/web-ui-registration';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import PatientUserAutoComplete from './PatientUserAutoComplete';
import { getURL } from '../../../../app/utils/client';
import '../uikit/medsenseUIKit.css';

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
		invite_sent: 'Invite sent',
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

const formatSessionState = (request: any) => {
	const voice = request?.voice;
	if (voice?.active === true) {
		return voice.state ? String(voice.state).replace(/_/g, ' ') : 'Active';
	}
	if (voice?.state && voice.state !== 'idle') {
		return String(voice.state).replace(/_/g, ' ');
	}
	if (request?.status) {
		return formatRequestStatus(request.status);
	}
	return 'Idle';
};

const sessionStateVariant = (request: any) => {
	const voice = request?.voice;
	if (voice?.active === true) {
		return 'featured';
	}
	if (request?.status === 'taken') {
		return 'primary';
	}
	return 'secondary';
};

const hasVoiceSessionContext = (request: any) => {
	const voice = request?.voice;
	if (!voice || typeof voice !== 'object') {
		return false;
	}
	return Boolean(
		voice.sessionId ||
			voice.transport ||
			voice.roomName ||
			voice.lastTranscriptAt ||
			voice.lastTtsAt ||
			voice.lastEventAt ||
			(voice.state && voice.state !== 'idle') ||
			voice.active === true,
	);
};

const isVoiceSessionCallable = (request: any) => {
	const voice = request?.voice;
	const patientPresent = voice?.participants?.patient?.present;
	const state = String(voice?.state || '')
		.trim()
		.toLowerCase();
	const isTerminalState = ['ended', 'disconnected', 'closed'].includes(state);
	return voice?.active === true && patientPresent === true && !isTerminalState;
};

const normalizePreviewMessages = (messages: any[], request: any) => {
	const requestedBy = String(request?.requestedByUsername || '')
		.trim()
		.toLowerCase();
	return (Array.isArray(messages) ? messages : [])
		.map((message: any) => {
			const senderName = String(message?.u?.name || message?.u?.username || message?.username || message?.alias || '').trim() || 'System';
			const text = String(message?.msg || '').trim() || (message?.t ? `[${String(message.t).replace(/_/g, ' ')}]` : '');
			const loweredSender = senderName.toLowerCase();
			const kind = message?.t
				? 'system'
				: loweredSender.includes('bot') || loweredSender.includes('medsense')
					? 'bot'
					: requestedBy && loweredSender === requestedBy
						? 'patient'
						: 'staff';
			return {
				id: String(message?._id || message?.id || `${senderName}-${message?.ts || Math.random()}`),
				ts: message?.ts || message?._updatedAt || null,
				senderName,
				text: text || '(no text)',
				kind,
			};
		})
		.filter((message) => Boolean(message.text))
		.sort((left, right) => new Date(left.ts || 0).getTime() - new Date(right.ts || 0).getTime())
		.slice(-10);
};

const previewTagVariant = (kind: string) => {
	switch (kind) {
		case 'patient':
			return 'featured';
		case 'staff':
			return 'primary';
		case 'bot':
			return 'secondary-warning';
		case 'system':
			return 'secondary';
		default:
			return 'secondary';
	}
};

const buildPreviewVoicemailPlaybackUrl = (roomId: string | undefined, uploadId: unknown): string | null => {
	const safeRoomId = String(roomId || '').trim();
	const safeUploadId = String(uploadId || '').trim();
	if (!safeRoomId || !safeUploadId) {
		return null;
	}

	return getURL(
		`/api/v1/medsense/voice.voicemail.playback?roomId=${encodeURIComponent(safeRoomId)}&uploadId=${encodeURIComponent(safeUploadId)}`,
		{ cdn: false },
	);
};

const normalizePreviewVoicemailRecords = (sessionInfo: any, roomId?: string) => {
	const records = Array.isArray(sessionInfo?.voice?.voicemailRecords) ? sessionInfo.voice.voicemailRecords : [];
	return records
		.map((record: any) => ({
			id: String(record?.eventId || record?.recordingSid || record?.uploadId || record?.receivedAt || Math.random()),
			receivedAt: record?.receivedAt || record?.timestamp || null,
			durationSeconds: typeof record?.durationSeconds === 'number' ? record.durationSeconds : Number(record?.durationSeconds || 0) || null,
			recordingStatus: String(record?.recordingStatus || 'unknown'),
			uploadUrl: typeof record?.uploadUrl === 'string' && record.uploadUrl.trim() ? record.uploadUrl.trim() : null,
			uploadId: typeof record?.uploadId === 'string' && record.uploadId.trim() ? record.uploadId.trim() : null,
			playbackUrl: buildPreviewVoicemailPlaybackUrl(roomId, record?.uploadId),
			transcriptText: typeof record?.transcriptText === 'string' && record.transcriptText.trim() ? record.transcriptText.trim() : '',
			storageError: typeof record?.storageError === 'string' && record.storageError.trim() ? record.storageError.trim() : '',
		}))
		.sort((left, right) => new Date(right.receivedAt || 0).getTime() - new Date(left.receivedAt || 0).getTime());
};

type PreviewPastAnswer = {
	question: string;
	answer: string;
	timestamp: string | null;
};

const clampPreviewIndex = (index: number, length: number): number => {
	if (length <= 0) {
		return 0;
	}

	return Math.max(0, Math.min(index, length - 1));
};

const normalizePreviewPastAnswers = (sessionInfo: any): PreviewPastAnswer[] => {
	const rawEntries = Array.isArray(sessionInfo?.roomFormSubmissions)
		? sessionInfo.roomFormSubmissions
		: Array.isArray(sessionInfo?.recentSubmittedAnswers)
			? sessionInfo.recentSubmittedAnswers
			: [];

	return rawEntries
		.map((entry: any) => {
			const rawAnswer = entry?.answer ?? entry?.selection ?? entry?.value;
			let answer = '';

			if (typeof rawAnswer === 'string') {
				answer = rawAnswer.trim();
			} else if (Array.isArray(rawAnswer)) {
				answer = rawAnswer
					.map((item) => (typeof item === 'string' ? item.trim() : ''))
					.filter(Boolean)
					.join(', ');
			} else if (rawAnswer && typeof rawAnswer === 'object') {
				try {
					answer = JSON.stringify(rawAnswer);
				} catch {
					answer = '';
				}
			}

			const question =
				typeof entry?.question === 'string' && entry.question.trim()
					? entry.question.trim()
					: typeof entry?.prompt === 'string' && entry.prompt.trim()
						? entry.prompt.trim()
						: 'Question';

			const timestamp =
				typeof entry?.timestamp === 'string'
					? entry.timestamp
					: typeof entry?.submittedAt === 'string'
						? entry.submittedAt
						: typeof entry?.ts === 'string'
							? entry.ts
							: null;

			return {
				question,
				answer: answer || 'No answer provided',
				timestamp,
			};
		})
		.filter((entry) => Boolean(entry.question || entry.answer))
		.sort((left, right) => new Date(left.timestamp || 0).getTime() - new Date(right.timestamp || 0).getTime());
};

const QueuePreviewModal = ({ request, onClose }: { request: any; onClose: () => void }): JSX.Element => {
	const t = useTranslation();
	const formatDate = useFormatDate();
	const isDarkMode = useDarkMode();
	const getRoomSessionInfo = useEndpoint('GET', '/v1/medsense/room.sessionInfo');
	const getRoomPreview = useEndpoint('GET', '/v1/medsense/room.preview');
	const [pastAnswerIndex, setPastAnswerIndex] = useState(0);
	const [voicemailPlaybackErrors, setVoicemailPlaybackErrors] = useState<Record<string, string>>({});

	const { data, isLoading, error } = useQuery({
		queryKey: ['queue-preview-modal', request?.roomId],
		queryFn: async () => {
			if (!request?.roomId) {
				return { room: null, sessionInfo: null, messages: [] };
			}
			const [previewResponse, sessionInfoResponse] = await Promise.all([
				getRoomPreview({ roomId: request.roomId, count: 10 }),
				getRoomSessionInfo({ roomId: request.roomId }),
			]);
			return {
				room: previewResponse?.room || null,
				sessionInfo: sessionInfoResponse?.sessionInfo || null,
				messages: normalizePreviewMessages(previewResponse?.messages || [], request),
			};
		},
		enabled: Boolean(request?.roomId),
	});

	const contextSummary = useMemo(() => {
		return typeof data?.sessionInfo?.summary?.text === 'string' ? data.sessionInfo.summary.text : '';
	}, [data?.sessionInfo]);
	const pastAnswers = useMemo(() => normalizePreviewPastAnswers(data?.sessionInfo), [data?.sessionInfo]);
	const voicemailRecords = useMemo(
		() => normalizePreviewVoicemailRecords(data?.sessionInfo, request?.roomId),
		[data?.sessionInfo, request?.roomId],
	);
	const activePastAnswer = pastAnswers[clampPreviewIndex(pastAnswerIndex, pastAnswers.length)];
	const themeClass = isDarkMode ? 'medsenseUIKit--theme-dark' : 'medsenseUIKit--theme-light';

	useEffect(() => {
		setPastAnswerIndex((current) => clampPreviewIndex(current, pastAnswers.length));
	}, [pastAnswers.length]);

	useEffect(() => {
		setVoicemailPlaybackErrors({});
	}, [request?.roomId]);

	return (
		<Modal {...({ style: { width: 'min(960px, 92vw)' } } as any)}>
			<ModalHeader>
				<Box display='flex' flexDirection='column' flexGrow={1} gap='x8'>
					<ModalTitle>Conversation Preview</ModalTitle>
					<Box display='flex' flexWrap='wrap' gap='x8' alignItems='center'>
						<Tag variant='secondary'>{request?.requestedByUsername || 'Unknown'}</Tag>
						<Tag variant={(request?.status ? 'primary' : 'secondary') as any}>
							{request?.status ? formatRequestStatus(request.status) : 'Unknown'}
						</Tag>
						<Tag variant={sessionStateVariant(request) as any}>{formatSessionState(request)}</Tag>
					</Box>
				</Box>
				<ModalClose onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				<Box display='flex' flexDirection='column' gap='x16'>
					<Box display='grid' gap='x16' {...({ style: { gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' } } as any)}>
						<Box p='x16' borderRadius='x8' bg='neutral-100'>
							<Box fontScale='c2' color='default' mbe='x8'>
								Request Details
							</Box>
							<Box mbe='x8'>
								<b>{t('Patient')}:</b> {request?.requestedByUsername || 'Unknown'}
							</Box>
							<Box mbe='x8'>
								<b>{t('Issue')}:</b> {request?.reason || '-'}
							</Box>
							<Box mbe='x8'>
								<b>{t('Room')}:</b> {data?.room?.fname || data?.room?.name || request?.roomName || '-'}
							</Box>
							<Box>
								<b>Taken at:</b> {formatDate(request?.takenAt || request?.createdAt)}
							</Box>
						</Box>
						<Box p='x16' borderRadius='x8' bg='neutral-100'>
							<Box fontScale='c2' color='default' mbe='x8'>
								{t('Context_Summary')}
							</Box>
							<Box whiteSpace='pre-wrap' color='default'>
								{contextSummary || t('No_summary_available')}
							</Box>
						</Box>
					</Box>

					<Box p='x16' borderRadius='x8' bg='neutral-100'>
						<Box display='flex' justifyContent='space-between' alignItems='center' gap='x12' mbe='x12'>
							<Box fontScale='c2' color='default'>
								Past Answers
							</Box>
							{pastAnswers.length > 1 ? (
								<div className='medsenseSmartFormsDock__switcher'>
									<button
										type='button'
										className='medsenseSmartFormsDock__switcherButton'
										onClick={() => setPastAnswerIndex((current) => clampPreviewIndex(current - 1, pastAnswers.length))}
										disabled={pastAnswerIndex <= 0}
									>
										&lt;
									</button>
									<span className='medsenseSmartFormsDock__switcherCount'>
										{pastAnswerIndex + 1} of {pastAnswers.length}
									</span>
									<button
										type='button'
										className='medsenseSmartFormsDock__switcherButton'
										onClick={() => setPastAnswerIndex((current) => clampPreviewIndex(current + 1, pastAnswers.length))}
										disabled={pastAnswerIndex >= pastAnswers.length - 1}
									>
										&gt;
									</button>
								</div>
							) : null}
						</Box>
						{isLoading && (
							<Box display='flex' justifyContent='center' p='x24'>
								<Throbber size='x24' />
							</Box>
						)}
						{!isLoading && error && <Callout type='danger'>{t('Error')}</Callout>}
						{!isLoading && !error && pastAnswers.length === 0 && <Callout type='info'>No past answers yet.</Callout>}
						{!isLoading && !error && activePastAnswer ? (
							<div className={`medsenseUIKit ${themeClass}`}>
								<div className='medsenseSmartFormsDock__responseCard'>
									<div className='medsenseSmartFormsDock__responseQuestion'>{activePastAnswer.question}</div>
									<div className='medsenseSmartFormsDock__responseAnswer'>{activePastAnswer.answer}</div>
									{activePastAnswer.timestamp ? (
										<div className='medsenseSmartFormsDock__responseMeta'>{formatDate(activePastAnswer.timestamp)}</div>
									) : null}
								</div>
							</div>
						) : null}
					</Box>

					{!isLoading && !error && voicemailRecords.length > 0 && (
						<Box p='x16' borderRadius='x8' bg='neutral-100'>
							<Box fontScale='c2' color='default' mbe='x12'>
								After-hours voicemail
							</Box>
							<Box display='flex' flexDirection='column' gap='x12'>
								{voicemailRecords.map((record: any) => {
									const playbackError = voicemailPlaybackErrors[record.id];
									return (
										<Box
											key={record.id}
											p='x12'
											borderRadius='x8'
											bg='surface-light'
											{...({ style: { border: '1px solid var(--rcx-color-stroke-light)' } } as any)}
										>
											<Box display='flex' justifyContent='space-between' alignItems='center' gap='x8' mbe='x8' flexWrap='wrap'>
												<Box display='flex' alignItems='center' gap='x8' flexWrap='wrap'>
													<Tag variant={record.uploadId ? ('featured' as any) : ('secondary-warning' as any)}>
														{record.uploadId ? 'audio ready' : record.recordingStatus}
													</Tag>
													{record.durationSeconds ? <Tag variant='secondary'>{Math.round(record.durationSeconds)}s</Tag> : null}
												</Box>
												<Box fontScale='c1' color='hint'>
													{formatDate(record.receivedAt)}
												</Box>
											</Box>
											{record.transcriptText ? (
												<Box whiteSpace='pre-wrap' mbe='x8'>
													{record.transcriptText}
												</Box>
											) : null}
											{record.playbackUrl ? (
												<>
													<audio
														controls
														preload='none'
														src={record.playbackUrl}
														style={{ width: '100%' }}
														onError={() =>
															setVoicemailPlaybackErrors((current) => ({
																...current,
																[record.id]: 'Voicemail audio could not be played. Please check your access or try again.',
															}))
														}
													>
														Your browser does not support audio playback.
													</audio>
													{playbackError ? <Callout type='warning'>{playbackError}</Callout> : null}
												</>
											) : record.uploadId ? (
												<Callout type='warning'>Voicemail audio could not be prepared for playback.</Callout>
											) : record.storageError ? (
												<Callout type='warning'>{record.storageError}</Callout>
											) : (
												<Callout type='warning'>No voicemail audio captured.</Callout>
											)}
										</Box>
									);
								})}
							</Box>
						</Box>
					)}

					<Box p='x16' borderRadius='x8' bg='neutral-100'>
						<Box fontScale='c2' color='default' mbe='x12'>
							Recent Messages
						</Box>
						{isLoading && (
							<Box display='flex' justifyContent='center' p='x24'>
								<Throbber size='x24' />
							</Box>
						)}
						{!isLoading && error && <Callout type='danger'>{t('Error')}</Callout>}
						{!isLoading && !error && (!data?.messages || data.messages.length === 0) && <Callout type='info'>No recent messages</Callout>}
						{!isLoading && !error && Array.isArray(data?.messages) && data.messages.length > 0 && (
							<Box display='flex' flexDirection='column' gap='x8' overflow='auto' {...({ style: { maxHeight: '360px' } } as any)}>
								{data.messages.map((message: any) => (
									<Box
										key={message.id}
										p='x12'
										borderRadius='x8'
										bg='surface-light'
										{...({ style: { border: '1px solid var(--rcx-color-stroke-light)' } } as any)}
									>
										<Box display='flex' justifyContent='space-between' alignItems='center' gap='x8' mbe='x4'>
											<Box display='flex' alignItems='center' gap='x8' flexWrap='wrap'>
												<Tag variant={previewTagVariant(message.kind) as any}>{message.kind}</Tag>
												<Box fontScale='p2m'>{message.senderName}</Box>
											</Box>
											<Box fontScale='c1' color='hint'>
												{formatDate(message.ts)}
											</Box>
										</Box>
										<Box whiteSpace='pre-wrap'>{message.text}</Box>
									</Box>
								))}
							</Box>
						)}
					</Box>
				</Box>
			</ModalContent>
			<ModalFooter>
				<Button onClick={onClose}>{t('Close')}</Button>
			</ModalFooter>
		</Modal>
	);
};

const useStatusColors = (): Record<string, string> => {
	const settingValue = useSetting('Medsense_Queue_Status_Colors') as string | undefined;
	return useMemo(() => {
		const defaultColors: Record<string, string> = {
			invite_sent: 'secondary',
			waiting_patient: 'warning',
			ai_preassessment: 'secondary',
			after_hours: 'secondary-warning',
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

type SignalWireVideoSdk = {
	Video: {
		RoomSession: new (...args: any[]) => any;
	};
};

let signalWireBrowserSdkLoader: Promise<SignalWireVideoSdk> | null = null;
const loadSignalWireBrowserSdk = async (): Promise<SignalWireVideoSdk> => {
	const globalWindow = window as any;
	if (globalWindow?.SignalWire?.Video?.RoomSession) {
		return { Video: globalWindow.SignalWire.Video };
	}
	if (!signalWireBrowserSdkLoader) {
		signalWireBrowserSdkLoader = import('@signalwire/js')
			.then((module) => {
				const resolvedVideo =
					(module as any)?.Video ||
					(module as any)?.SignalWire?.Video ||
					(module as any)?.default?.Video ||
					globalWindow?.SignalWire?.Video;
				if (!resolvedVideo?.RoomSession) {
					throw new Error('SignalWire Browser SDK v3 is unavailable.');
				}
				return { Video: resolvedVideo } as SignalWireVideoSdk;
			})
			.catch((error: any) => {
				signalWireBrowserSdkLoader = null;
				throw new Error(`SignalWire Browser SDK failed to load: ${error?.message || String(error)}`);
			});
	}
	return signalWireBrowserSdkLoader;
};

const getVoiceJoinMediaErrorMessage = (error: any): string => {
	const name = String(error?.name || '').trim();
	if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
		return 'No microphone was found for browser voice. Use Call My Phone to join from your saved staff phone number.';
	}
	if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
		return 'Microphone permission was blocked. Allow microphone access or use Call My Phone.';
	}
	if (name === 'NotReadableError' || name === 'TrackStartError') {
		return 'The microphone is already in use or unavailable. Use Call My Phone if the browser cannot access it.';
	}
	return error?.message || 'Browser voice join failed. Use Call My Phone if the browser cannot access a microphone.';
};

const requestMicrophonePermission = async (): Promise<void> => {
	if (!navigator?.mediaDevices?.getUserMedia) {
		throw new Error('This browser cannot access a microphone. Use Call My Phone to join from your saved staff phone number.');
	}
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
	for (const track of stream.getTracks()) {
		track.stop();
	}
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
	const formatDate = useFormatDate();
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

	const handleTake = async (requestId: string) => {
		try {
			await takeMutation.mutateAsync({ requestId });
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
						<TableCell>Request</TableCell>
						<TableCell>Session</TableCell>
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
							<TableCell>
								<Tag variant={sessionStateVariant(request) as any}>{formatSessionState(request)}</Tag>
							</TableCell>
							<TableCell>{request.roomName || '-'}</TableCell>
							<TableCell>{formatDate(request.createdAt)}</TableCell>
							<TableCell>
								<Box display='flex' gap='x8' flexWrap='wrap'>
									<Button small onClick={() => setPreviewRequest(request)}>
										{t('View')}
									</Button>
									<Button
										small
										primary
										onClick={() => handleTake(request._id)}
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

			{previewRequest && <QueuePreviewModal request={previewRequest} onClose={() => setPreviewRequest(null)} />}

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
	const formatDate = useFormatDate();
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const closeAction = useEndpoint('POST', '/v1/medsense/request.close');
	const endVoiceAction = useEndpoint('POST', '/v1/medsense/voice.session.end');
	const browserTokenAction = useEndpoint('POST', '/v1/medsense/voice.browser-token');
	const staffPhoneJoinAction = useEndpoint('POST', '/v1/medsense/voice.staff-phone-join');
	const staffTranscriptAction = useEndpoint('POST', '/v1/medsense/voice.staff-transcript');
	const activeVoiceRef = useRef<{
		roomId: string | null;
		sessionId: string | null;
		roomSession: any;
		recognition: any;
		recognitionRestart: boolean;
		eventIndex: number;
	}>({
		roomId: null,
		sessionId: null,
		roomSession: null,
		recognition: null,
		recognitionRestart: false,
		eventIndex: 0,
	});
	const [joiningVoiceRoomId, setJoiningVoiceRoomId] = useState<string | null>(null);
	const [callingVoiceRoomId, setCallingVoiceRoomId] = useState<string | null>(null);
	const [joinedVoiceRoomId, setJoinedVoiceRoomId] = useState<string | null>(null);
	const [previewRequest, setPreviewRequest] = useState<any>(null);

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

	const stopStaffRecognition = useCallback(() => {
		const runtime = activeVoiceRef.current;
		runtime.recognitionRestart = false;
		if (runtime.recognition && typeof runtime.recognition.stop === 'function') {
			try {
				runtime.recognition.stop();
			} catch {
				// ignore browser recognition stop errors
			}
		}
		runtime.recognition = null;
	}, []);

	const startStaffRecognition = useCallback(
		(roomId: string) => {
			const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			if (!SpeechRecognitionCtor) {
				dispatchToastMessage({
					type: 'warning',
					message: 'Browser voice joined, but Web Speech API is unavailable in this browser.',
				});
				return;
			}

			const runtime = activeVoiceRef.current;
			const recognition = new SpeechRecognitionCtor();
			recognition.lang = 'en-US';
			recognition.interimResults = true;
			recognition.continuous = true;
			runtime.recognitionRestart = true;
			runtime.recognition = recognition;

			recognition.onresult = (event: any) => {
				for (let i = event.resultIndex; i < event.results.length; i += 1) {
					const result = event.results[i];
					if (!result?.isFinal) continue;
					const text = String(result?.[0]?.transcript || '').trim();
					if (!text) continue;
					runtime.eventIndex += 1;
					const eventId = `staff-${runtime.sessionId || 'session'}-${Date.now()}-${runtime.eventIndex}`;
					void staffTranscriptAction({
						roomId,
						text,
						eventId,
						final: true,
						confidence: typeof result?.[0]?.confidence === 'number' ? result[0].confidence : undefined,
						timestamp: new Date().toISOString(),
					});
				}
			};

			recognition.onend = () => {
				if (!runtime.recognitionRestart || runtime.roomId !== roomId) {
					return;
				}
				try {
					recognition.start();
				} catch {
					// ignore auto-restart errors
				}
			};

			try {
				recognition.start();
			} catch {
				// ignore start race errors
			}
		},
		[dispatchToastMessage, staffTranscriptAction],
	);

	const leaveVoiceJoin = useCallback(async () => {
		const runtime = activeVoiceRef.current;
		stopStaffRecognition();
		if (runtime.roomSession && typeof runtime.roomSession.leave === 'function') {
			try {
				await runtime.roomSession.leave();
			} catch {
				// ignore leave errors
			}
		}
		runtime.roomSession = null;
		runtime.roomId = null;
		runtime.sessionId = null;
		runtime.eventIndex = 0;
		setJoinedVoiceRoomId(null);
		setJoiningVoiceRoomId(null);
	}, [stopStaffRecognition]);

	const joinVoiceAudio = useCallback(
		async (request: any) => {
			if (!request?.roomId) {
				dispatchToastMessage({ type: 'error', message: 'Room is missing for this request.' });
				return;
			}
			if (joinedVoiceRoomId && joinedVoiceRoomId === request.roomId) {
				return;
			}
			if (joinedVoiceRoomId && joinedVoiceRoomId !== request.roomId) {
				await leaveVoiceJoin();
			}

			setJoiningVoiceRoomId(request.roomId);
			try {
				await requestMicrophonePermission();
				const tokenPayload = await browserTokenAction({ roomId: request.roomId });
				const roomToken = String(tokenPayload?.roomToken || '').trim();
				if (!roomToken) {
					throw new Error('Voice browser token is missing roomToken.');
				}

				const signalWire = await loadSignalWireBrowserSdk();
				const roomSession = new signalWire.Video.RoomSession({
					token: roomToken,
				});

				const runtime = activeVoiceRef.current;
				runtime.roomSession = roomSession;
				runtime.roomId = request.roomId;
				runtime.sessionId = tokenPayload?.sessionId || request.voice?.sessionId || null;
				runtime.eventIndex = 0;

				if (typeof roomSession.on === 'function') {
					roomSession.on('room.left', () => {
						void leaveVoiceJoin();
					});
				}

				await roomSession.join({
					audio: true,
					video: false,
					sendAudio: true,
					sendVideo: false,
				});
				setJoinedVoiceRoomId(request.roomId);
				setJoiningVoiceRoomId(null);
				dispatchToastMessage({ type: 'success', message: 'Voice browser audio joined.' });
				startStaffRecognition(request.roomId);
			} catch (error: any) {
				setJoiningVoiceRoomId(null);
				dispatchToastMessage({
					type: 'error',
					message: getVoiceJoinMediaErrorMessage(error),
				});
			}
		},
		[browserTokenAction, dispatchToastMessage, joinedVoiceRoomId, leaveVoiceJoin, startStaffRecognition],
	);

	const callMyPhoneForVoice = useCallback(
		async (request: any) => {
			if (!request?.roomId) {
				dispatchToastMessage({ type: 'error', message: 'Room is missing for this request.' });
				return;
			}
			setCallingVoiceRoomId(request.roomId);
			try {
				const response = await staffPhoneJoinAction({ roomId: request.roomId });
				dispatchToastMessage({
					type: 'success',
					message: `Calling your saved staff phone${response?.staffPhoneMasked ? ` (${response.staffPhoneMasked})` : ''}.`,
				});
			} catch (error: any) {
				dispatchToastMessage({
					type: 'error',
					message: error?.error || error?.message || 'Could not call your saved staff phone.',
				});
			} finally {
				setCallingVoiceRoomId(null);
			}
		},
		[dispatchToastMessage, staffPhoneJoinAction],
	);

	useEffect(
		() => () => {
			void leaveVoiceJoin();
		},
		[leaveVoiceJoin],
	);

	const endVoiceMutation = useMutation({
		mutationFn: async ({ roomId }: { roomId: string }) => endVoiceAction({ roomId, reason: 'staff_end_from_queue' }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: 'Voice session ended' });
			queryClient.invalidateQueries({ queryKey: ['followed-queue'] });
			refetch();
		},
		onError: (error) => {
			const message = (error as any)?.error || (error as any)?.message || String(error);
			dispatchToastMessage({ type: 'error', message });
		},
	});

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
						<TableCell>{t('Status')}</TableCell>
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
								<Tag variant={sessionStateVariant(request) as any}>{formatSessionState(request)}</Tag>
							</TableCell>
							<TableCell>
								<Box display='flex' gap='x8' flexWrap='wrap'>
									<Button small onClick={() => setPreviewRequest(request)}>
										{t('View')}
									</Button>
									{hasVoiceSessionContext(request) && (
										<Button
											small
											onClick={() => (joinedVoiceRoomId === request.roomId ? void leaveVoiceJoin() : void joinVoiceAudio(request))}
											disabled={!isVoiceSessionCallable(request) || joiningVoiceRoomId === request.roomId}
										>
											{joinedVoiceRoomId === request.roomId && isVoiceSessionCallable(request)
												? 'Leave Voice'
												: joiningVoiceRoomId === request.roomId
													? 'Joining...'
													: 'Join Voice'}
										</Button>
									)}
									{hasVoiceSessionContext(request) && (
										<Button
											small
											onClick={() => void callMyPhoneForVoice(request)}
											disabled={!isVoiceSessionCallable(request) || callingVoiceRoomId === request.roomId}
										>
											{callingVoiceRoomId === request.roomId ? 'Calling...' : 'Call My Phone'}
										</Button>
									)}
									{hasVoiceSessionContext(request) && (
										<Button
											small
											danger
											onClick={() => endVoiceMutation.mutate({ roomId: request.roomId })}
											disabled={!isVoiceSessionCallable(request) || endVoiceMutation.isLoading}
										>
											End Voice
										</Button>
									)}
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
			{previewRequest && <QueuePreviewModal request={previewRequest} onClose={() => setPreviewRequest(null)} />}
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

	const docStatus = intervention.documentationStatus;

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
					{docStatus && (
						<Box>
							<b>{t('Documentation Status')}:</b> <Tag>{docStatus.toUpperCase()}</Tag>
						</Box>
					)}
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
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const [tab, setTab] = useState<'waiting' | 'followed' | 'history' | 'interventions'>('waiting');
	const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
	const [showRegistrationModal, setShowRegistrationModal] = useState(false);
	const [registrationName, setRegistrationName] = useState('');
	const [registrationEmail, setRegistrationEmail] = useState('');
	const [registrationUsername, setRegistrationUsername] = useState('');
	const [registrationPhone, setRegistrationPhone] = useState('');
	const [isRegistrationPhoneValid, setIsRegistrationPhoneValid] = useState(true);
	const [registrationReason, setRegistrationReason] = useState('');
	const [registrationSpecialtyActionId, setRegistrationSpecialtyActionId] = useState('');
	const [registrationPharmacyId, setRegistrationPharmacyId] = useState('');
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
	const getMyPharmacy = useEndpoint('GET', '/v1/medsense/patient.pharmacy.mine');
	const { data: myPharmacyData } = useQuery({
		queryKey: ['my-pharmacy'],
		queryFn: async () => getMyPharmacy(),
		enabled: canViewRequest,
	});
	const getRegistrationSpecialtyActions = useEndpoint('GET', '/v1/medsense/registration.specialtyActions');
	const { data: registrationSpecialtyActionsData } = useQuery({
		queryKey: ['registration-specialty-actions'],
		queryFn: async () => getRegistrationSpecialtyActions(),
		enabled: canViewRequest,
	});

	const pharmacyIds = useMemo(
		() => (pharmacyData?.pharmacies ? pharmacyData.pharmacies.map((p: any) => String(p._id)) : []),
		[pharmacyData],
	);
	const pharmacyOptions = useMemo(() => {
		if (!pharmacyData?.pharmacies?.length) return [];
		const options = pharmacyData.pharmacies.map((p: any) => [String(p._id), p.name]);
		return [['all', t('All')], ...options];
	}, [pharmacyData, t]);
	const registrationPharmacyOptions = useMemo(
		() =>
			pharmacyData?.pharmacies
				? pharmacyData.pharmacies.filter((p: any) => p?.active !== false).map((p: any) => [String(p._id), p.name])
				: [],
		[pharmacyData],
	);
	const registrationSpecialtyOptions = useMemo(() => {
		const actions = Array.isArray(registrationSpecialtyActionsData?.actions) ? registrationSpecialtyActionsData.actions : [];
		const options = actions
			.map((action: any) => {
				const value = String(action?.actionId || action?.id || '');
				if (!value) {
					return null;
				}
				const label = String(action?.label || value);
				return [value, label];
			})
			.filter((option: any): option is [string, string] => Array.isArray(option) && Boolean(option[0]));

		return [['', t('None')], ...options];
	}, [registrationSpecialtyActionsData, t]);
	const preferredPharmacyId = useMemo(() => String(myPharmacyData?.pharmacy?._id || ''), [myPharmacyData]);

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

	useEffect(() => {
		if (!showRegistrationModal || registrationPharmacyId) {
			return;
		}

		const allowedPharmacyIds = registrationPharmacyOptions.map((option: any) => String(option?.[0] || ''));

		if (preferredPharmacyId && allowedPharmacyIds.includes(preferredPharmacyId)) {
			setRegistrationPharmacyId(preferredPharmacyId);
			return;
		}

		if (selectedPharmacy && selectedPharmacy !== 'all') {
			setRegistrationPharmacyId(selectedPharmacy);
			return;
		}

		if (registrationPharmacyOptions.length > 0) {
			setRegistrationPharmacyId(String(registrationPharmacyOptions[0]?.[0] || ''));
		}
	}, [preferredPharmacyId, registrationPharmacyId, registrationPharmacyOptions, selectedPharmacy, showRegistrationModal]);

	const resetRegistrationForm = useCallback(() => {
		setShowRegistrationModal(false);
		setRegistrationName('');
		setRegistrationEmail('');
		setRegistrationUsername('');
		setRegistrationPhone('');
		setIsRegistrationPhoneValid(true);
		setRegistrationReason('');
		setRegistrationSpecialtyActionId('');
		setRegistrationPharmacyId('');
	}, []);

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

	const startRegistration = useEndpoint('POST', '/v1/medsense/registration.start');
	const startRegistrationMutation = useMutation({
		mutationFn: async () => {
			const payload = {
				phoneNumber: registrationPhone,
				name: registrationName || undefined,
				email: registrationEmail || undefined,
				username: registrationUsername || undefined,
				reason: registrationReason || undefined,
				pharmacyId: registrationPharmacyId,
				specialtyActionId: registrationSpecialtyActionId || undefined,
			};
			console.info('[Medsense][RegistrationStart][Staff]', payload);
			return startRegistration(payload);
		},
		onSuccess: () => {
			dispatchToastMessage({
				type: 'success',
				message: t('Patient_registration_sms_sent'),
			});
			resetRegistrationForm();
			queryClient.invalidateQueries({ queryKey: ['waiting-queue'] });
		},
		onError: (error: any) => {
			dispatchToastMessage({ type: 'error', message: error?.message || String(error) });
		},
	});

	const canSubmitRegistration = useMemo(() => {
		if (!registrationPhone.trim()) {
			return false;
		}
		if (!isRegistrationPhoneValid) {
			return false;
		}
		if (!registrationPharmacyId) {
			return false;
		}
		return true;
	}, [isRegistrationPhoneValid, registrationPhone, registrationPharmacyId]);

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
				<Box display='flex' alignItems='center' gap='x8'>
					<Box minWidth='x200'>
						<Select
							options={pharmacyOptions}
							value={selectedPharmacy}
							onChange={(val) => setSelectedPharmacy(String(val))}
							placeholder={t('Select_Pharmacy')}
							disabled={isLoadingPharmacies}
						/>
					</Box>
					{canViewRequest && <Button onClick={() => setShowRegistrationModal(true)}>{t('Register_Patient')}</Button>}
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

			{showRegistrationModal && (
				<Modal>
					<ModalHeader>
						<ModalTitle>{t('Register_Patient')}</ModalTitle>
						<ModalClose onClick={resetRegistrationForm} />
					</ModalHeader>
					<ModalContent>
						<Box display='flex' flexDirection='column' gap='x12'>
							<Field>
								<FieldLabel>{t('Preferred_Pharmacy')}</FieldLabel>
								<FieldRow>
									<Select
										options={registrationPharmacyOptions}
										value={registrationPharmacyId}
										onChange={(value) => {
											if (value === undefined || value === null) {
												return;
											}
											setRegistrationPharmacyId(String(value));
										}}
										placeholder={t('Select_Pharmacy')}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('Name')}</FieldLabel>
								<FieldRow>
									<TextInput
										value={registrationName}
										onChange={(event) => setRegistrationName(event.currentTarget.value)}
										placeholder={t('registration.component.form.name')}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('registration.component.form.email')}</FieldLabel>
								<FieldRow>
									<TextInput
										value={registrationEmail}
										onChange={(event) => setRegistrationEmail(event.currentTarget.value)}
										placeholder='name@example.com'
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('registration.component.form.username')}</FieldLabel>
								<FieldRow>
									<TextInput
										value={registrationUsername}
										onChange={(event) => setRegistrationUsername(event.currentTarget.value)}
										placeholder='jane.doe'
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('Phone_number')}</FieldLabel>
								<FieldRow>
									<PhoneNumberInput
										value={registrationPhone}
										onChange={setRegistrationPhone}
										onValidityChange={setIsRegistrationPhoneValid}
										name='registrationPhone'
										id='registrationPhone'
										defaultCountry='CA'
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('registration.component.form.reasonToJoin')}</FieldLabel>
								<FieldRow>
									<TextAreaInput
										value={registrationReason}
										onChange={(event) => setRegistrationReason(event.currentTarget.value)}
										rows={2}
									/>
								</FieldRow>
							</Field>
							<Field>
								<FieldLabel>{t('Specialty_flow')}</FieldLabel>
								<FieldRow>
									<Select
										options={registrationSpecialtyOptions}
										value={registrationSpecialtyActionId}
										onChange={(value) => setRegistrationSpecialtyActionId(String(value || ''))}
									/>
								</FieldRow>
							</Field>
						</Box>
					</ModalContent>
					<ModalFooter>
						<Button onClick={resetRegistrationForm}>{t('Cancel')}</Button>
						<Button
							primary
							onClick={() => startRegistrationMutation.mutate()}
							disabled={!canSubmitRegistration || startRegistrationMutation.isLoading}
						>
							{startRegistrationMutation.isLoading ? <Throbber inheritColor /> : t('Send_registration_sms')}
						</Button>
					</ModalFooter>
				</Modal>
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
