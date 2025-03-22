import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	useSetModal,
	useToastMessageDispatch,
	useUserId,
	useSetting,
	usePermission,
	useRole,
	useEndpoint,
	useMethod,
	useTranslation,
	useRouter,
	useUserSubscription,
} from '@rocket.chat/ui-contexts';
import { useCallback, useState, useEffect } from 'react';

import { usePutChatOnHoldMutation } from './usePutChatOnHoldMutation';
import { useReturnChatToQueueMutation } from './useReturnChatToQueueMutation';
import PlaceChatOnHoldModal from '../../../../../../../app/livechat-enterprise/client/components/modals/PlaceChatOnHoldModal';
import { LegacyRoomManager } from '../../../../../../../app/ui-utils/client';
import CloseChatModal from '../../../../../../components/Omnichannel/modals/CloseChatModal';
import CloseChatModalData from '../../../../../../components/Omnichannel/modals/CloseChatModalData';
import ForwardChatModal from '../../../../../../components/Omnichannel/modals/ForwardChatModal';
import ReturnChatQueueModal from '../../../../../../components/Omnichannel/modals/ReturnChatQueueModal';
import TranscriptModal from '../../../../../../components/Omnichannel/modals/TranscriptModal';
import { useIsRoomOverMacLimit } from '../../../../../../hooks/omnichannel/useIsRoomOverMacLimit';
import { useOmnichannelRouteConfig } from '../../../../../../hooks/omnichannel/useOmnichannelRouteConfig';
import { useHasLicenseModule } from '../../../../../../hooks/useHasLicenseModule';
import { useLivechatInquiryStore } from '../../../../../../hooks/useLivechatInquiryStore';
import { quickActionHooks } from '../../../../../../ui';
import { useOmnichannelRoom } from '../../../../contexts/RoomContext';
import type { QuickActionsActionConfig } from '../../../../lib/quickActions';
import { QuickActionsEnum } from '../../../../lib/quickActions';

export const useQuickActions = (): {
	quickActions: QuickActionsActionConfig[];
	actionDefault: (actionId: string) => void;
} => {
	const room = useOmnichannelRoom();
	const setModal = useSetModal();
	const router = useRouter();

	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [onHoldModalActive, setOnHoldModalActive] = useState(false);

	const visitorRoomId = room.v._id;
	const rid = room._id;
	const uid = useUserId();
	const subscription = useUserSubscription(rid);
	const roomLastMessage = room.lastMessage;

	const getVisitorInfo = useEndpoint('GET', '/v1/livechat/visitors.info');

	const getVisitorEmail = useEffectEvent(async () => {
		if (!visitorRoomId) {
			return;
		}

		const {
			visitor: { visitorEmails },
		} = await getVisitorInfo({ visitorId: visitorRoomId });

		if (visitorEmails?.length && visitorEmails[0].address) {
			return visitorEmails[0].address;
		}
	});

	useEffect(() => {
		if (onHoldModalActive && roomLastMessage?.token) {
			setModal(null);
		}
	}, [roomLastMessage, onHoldModalActive, setModal]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const requestTranscript = useEndpoint('POST', '/v1/livechat/transcript/:rid', { rid });

	const handleRequestTranscript = useCallback(
		async (email: string, subject: string) => {
			try {
				await requestTranscript({ email, subject });
				closeModal();
				dispatchToastMessage({
					type: 'success',
					message: t('Livechat_email_transcript_has_been_requested'),
				});
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeModal, dispatchToastMessage, requestTranscript, t],
	);

	const sendTranscriptPDF = useEndpoint('POST', '/v1/omnichannel/:rid/request-transcript', { rid });

	const handleSendTranscriptPDF = useCallback(async () => {
		try {
			await sendTranscriptPDF();
			dispatchToastMessage({
				type: 'success',
				message: t('Livechat_transcript_has_been_requested'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, sendTranscriptPDF, t]);

	const sendTranscript = useMethod('livechat:sendTranscript');

	const handleSendTranscript = useCallback(
		async (email: string, subject: string, token: string) => {
			try {
				await sendTranscript(token, rid, email, subject);
				closeModal();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeModal, dispatchToastMessage, rid, sendTranscript],
	);

	const discardTranscript = useEndpoint('DELETE', '/v1/livechat/transcript/:rid', { rid });

	const handleDiscardTranscript = useCallback(async () => {
		try {
			await discardTranscript();
			dispatchToastMessage({
				type: 'success',
				message: t('Livechat_transcript_request_has_been_canceled'),
			});
			closeModal();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [closeModal, discardTranscript, dispatchToastMessage, t]);

	const forwardChat = useEndpoint('POST', '/v1/livechat/room.forward');

	const handleForwardChat = useCallback(
		async (departmentId?: string, userId?: string, comment?: string) => {
			if (departmentId && userId) {
				return;
			}
			const transferData: {
				roomId: string;
				clientAction: boolean;
				comment?: string;
				departmentId?: string;
				userId?: string;
			} = {
				roomId: rid,
				comment,
				clientAction: true,
			};

			if (departmentId) {
				transferData.departmentId = departmentId;
			}
			if (userId) {
				transferData.userId = userId;
			}

			try {
				await forwardChat(transferData);
				dispatchToastMessage({ type: 'success', message: t('Transferred') });
				router.navigate('/home');
				LegacyRoomManager.close(room.t + rid);
				closeModal();
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeModal, dispatchToastMessage, forwardChat, room.t, rid, router, t],
	);

	const closeChat = useEndpoint('POST', '/v1/livechat/room.closeByUser');

	const discardForRoom = useLivechatInquiryStore((state) => state.discardForRoom);

	const handleClose = useCallback(
		async (
			comment?: string,
			tags?: string[],
			preferences?: { omnichannelTranscriptPDF: boolean; omnichannelTranscriptEmail: boolean },
			requestData?: { email: string; subject: string },
		) => {
			try {
				await closeChat({
					rid,
					...(comment && { comment }),
					...(tags && { tags }),
					...(preferences?.omnichannelTranscriptPDF && { generateTranscriptPdf: true }),
					...(preferences?.omnichannelTranscriptEmail && requestData
						? {
								transcriptEmail: {
									sendToVisitor: preferences?.omnichannelTranscriptEmail,
									requestData,
								},
							}
						: { transcriptEmail: { sendToVisitor: false } }),
				});
				discardForRoom(rid);
				closeModal();
				dispatchToastMessage({ type: 'success', message: t('Chat_closed_successfully') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		},
		[closeChat, closeModal, dispatchToastMessage, rid, t, discardForRoom],
	);

	const returnChatToQueueMutation = useReturnChatToQueueMutation({
		onSuccess: () => {
			LegacyRoomManager.close(room.t + rid);
			router.navigate('/home');
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			closeModal();
		},
	});

	const putChatOnHoldMutation = usePutChatOnHoldMutation({
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Chat_On_Hold_Successfully') });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			closeModal();
		},
	});

	const handleAction = useEffectEvent(async (id: string) => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				setModal(
					<ReturnChatQueueModal
						onMoveChat={(): void => returnChatToQueueMutation.mutate(rid)}
						onCancel={(): void => {
							closeModal();
						}}
					/>,
				);
				break;
			case QuickActionsEnum.TranscriptPDF:
				handleSendTranscriptPDF();
				break;
			case QuickActionsEnum.TranscriptEmail:
				const visitorEmail = await getVisitorEmail();

				if (!visitorEmail) {
					dispatchToastMessage({ type: 'error', message: t('Customer_without_registered_email') });
					break;
				}

				setModal(
					<TranscriptModal
						room={room}
						email={visitorEmail}
						onRequest={handleRequestTranscript}
						onSend={handleSendTranscript}
						onDiscard={handleDiscardTranscript}
						onCancel={closeModal}
					/>,
				);
				break;
			case QuickActionsEnum.ChatForward:
				setModal(<ForwardChatModal room={room} onForward={handleForwardChat} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.CloseChat:
				const email = await getVisitorEmail();
				setModal(
					room.departmentId ? (
						<CloseChatModalData visitorEmail={email} departmentId={room.departmentId} onConfirm={handleClose} onCancel={closeModal} />
					) : (
						<CloseChatModal visitorEmail={email} onConfirm={handleClose} onCancel={closeModal} />
					),
				);
				break;
			case QuickActionsEnum.OnHoldChat:
				setModal(
					<PlaceChatOnHoldModal
						onOnHoldChat={(): void => putChatOnHoldMutation.mutate(rid)}
						onCancel={(): void => {
							closeModal();
							setOnHoldModalActive(false);
						}}
					/>,
				);
				setOnHoldModalActive(true);
				break;
			default:
				break;
		}
	});

	const omnichannelRouteConfig = useOmnichannelRouteConfig();

	const manualOnHoldAllowed = useSetting('Livechat_allow_manual_on_hold');

	const hasManagerRole = useRole('livechat-manager');
	const hasMonitorRole = useRole('livechat-monitor');

	const roomOpen = room?.open && (room.u?._id === uid || hasManagerRole || hasMonitorRole) && room?.lastMessage?.t !== 'livechat-close';
	const canMoveQueue = !!omnichannelRouteConfig?.returnQueue && room?.u !== undefined;
	const canForwardGuest = usePermission('transfer-livechat-guest');
	const canSendTranscriptEmail = usePermission('send-omnichannel-chat-transcript');
	const hasLicense = useHasLicenseModule('livechat-enterprise');
	const canSendTranscriptPDF = usePermission('request-pdf-transcript');
	const canCloseRoom = usePermission('close-livechat-room');
	const canCloseOthersRoom = usePermission('close-others-livechat-room');
	const restrictedOnHold = useSetting('Livechat_allow_manual_on_hold_upon_agent_engagement_only');
	const canRoomBePlacedOnHold = !room.onHold && room.u;
	const canAgentPlaceOnHold = !room.lastMessage?.token;
	const canPlaceChatOnHold = Boolean(manualOnHoldAllowed && canRoomBePlacedOnHold && (!restrictedOnHold || canAgentPlaceOnHold));
	const isRoomOverMacLimit = useIsRoomOverMacLimit(room);

	const hasPermissionButtons = (id: string): boolean => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				return !isRoomOverMacLimit && !!roomOpen && canMoveQueue;
			case QuickActionsEnum.ChatForward:
				return !isRoomOverMacLimit && !!roomOpen && canForwardGuest;
			case QuickActionsEnum.Transcript:
				return !isRoomOverMacLimit && (canSendTranscriptEmail || (hasLicense && canSendTranscriptPDF));
			case QuickActionsEnum.TranscriptEmail:
				return !isRoomOverMacLimit && canSendTranscriptEmail;
			case QuickActionsEnum.TranscriptPDF:
				return hasLicense && !isRoomOverMacLimit && canSendTranscriptPDF;
			case QuickActionsEnum.CloseChat:
				return (subscription && (canCloseRoom || canCloseOthersRoom)) || (!!roomOpen && canCloseOthersRoom);
			case QuickActionsEnum.OnHoldChat:
				return !!roomOpen && canPlaceChatOnHold;
			default:
				break;
		}
		return false;
	};

	const quickActions = quickActionHooks
		.map((quickActionHook) => quickActionHook())
		.filter((quickAction): quickAction is QuickActionsActionConfig => !!quickAction)
		.filter((action) => {
			const { options, id } = action;
			if (options) {
				action.options = options.filter(({ id }) => hasPermissionButtons(id));
			}

			return hasPermissionButtons(id);
		})
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

	const actionDefault = useEffectEvent((actionId: string) => {
		handleAction(actionId);
	});

	return { quickActions, actionDefault };
};
