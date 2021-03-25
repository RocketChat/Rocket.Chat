import React, { memo, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { BoxProps, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import toastr from 'toastr';

import Header from '../../../../../components/Header';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { QuickActionsActionConfig, QuickActionsEnum } from '../../../lib/QuickActions';
import { useLayout } from '../../../../../contexts/LayoutContext';
import { useSetModal } from '../../../../../contexts/ModalContext';
import { QuickActionsContext } from '../../../lib/QuickActions/QuickActionsContext';
import ReturnChatQueueModal from '../../../../../components/Omnichannel/modals/ReturnChatQueueModal';
import ForwardChatModal from '../../../../../components/Omnichannel/modals/ForwardChatModal';
import TranscriptModal from '../../../../../components/Omnichannel/modals/TranscriptModal';
import CloseChatModal from '../../../../../components/Omnichannel/modals/CloseChatModal';
import { handleError } from '../../../../../../app/utils/client';
import { IRoom } from '../../../../../../definition/IRoom';
import { useAtLeastOnePermission, usePermission, useRole } from '../../../../../contexts/AuthorizationContext';
import { useUserId } from '../../../../../contexts/UserContext';
import { useOmnichannelRouteConfig } from '../../../../../contexts/OmnichannelContext';
import { useEndpoint, useMethod } from '../../../../../contexts/ServerContext';


const QuickActions = ({ room, className }: { room: IRoom; className: BoxProps['className'] }): JSX.Element => {
	const setModal = useSetModal();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions } = useContext(QuickActionsContext);
	const actions = (Array.from(mapActions.values()) as QuickActionsActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);
	const [email, setEmail] = useState('');
	const visitorRoomId = room.v?._id;
	const rid = room._id;
	const uid = useUserId();

	const getVisitorInfo = useEndpoint('GET', 'livechat/visitors.info');

	const getVisitorEmail = useMutableCallback(async () => {
		if (!visitorRoomId) { return; }
		const { visitor: { visitorEmails } } = await getVisitorInfo(visitorRoomId);
		if (visitorEmails?.length && visitorEmails[0].address) {
			setEmail(visitorEmails[0].address);
		}
	});

	useEffect(() => {
		getVisitorEmail();
	}, [room, getVisitorEmail]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const methodReturn = useMethod('livechat:returnAsInquiry');

	const handleMoveChat = useCallback(async () => {
		try {
			await methodReturn(rid);
			closeModal();
			Session.set('openedRoom', null);
			FlowRouter.go('/home');
		} catch (error) {
			handleError(error);
		}
	}, [closeModal, methodReturn, rid]);

	const requestTranscript = useMethod('livechat:requestTranscript');

	const handleRequestTranscript = useCallback(async (email: string, subject: string) => {
		try {
			await requestTranscript(rid, email, subject);
			closeModal();
			Session.set('openedRoom', null);
			FlowRouter.go('/home');
			toastr.success(t('Livechat_transcript_has_been_requested'));
		} catch (error) {
			handleError(error);
		}
	}, [closeModal, requestTranscript, rid, t]);

	const sendTranscript = useMethod('livechat:sendTranscript');

	const handleSendTranscript = useCallback(async (email: string, subject: string, token: string) => {
		try {
			await sendTranscript(token, rid, email, subject);
			closeModal();
		} catch (error) {
			handleError(error);
		}
	}, [closeModal, rid, sendTranscript]);

	const discardTranscript = useMethod('livechat:discardTranscript');

	const handleDiscardTranscript = useCallback(async () => {
		try {
			await discardTranscript(rid);
			toastr.success(t('Livechat_transcript_request_has_been_canceled'));
			closeModal();
		} catch (error) {
			handleError(error);
		}
	}, [closeModal, discardTranscript, rid, t]);

	const forwardChat = useMethod('livechat:transfer');

	const handleForwardChat = useCallback(async (departmentId?: string, userId?: string, comment?: string) => {
		if (departmentId && userId) {
			return;
		}
		const transferData: { roomId: string; comment?: string; departmentId?: string; userId?: string } = {
			roomId: rid,
			comment,
		};

		if (departmentId) { transferData.departmentId = departmentId; }
		if (userId) { transferData.userId = userId; }

		try {
			await forwardChat(transferData);
			closeModal();
			toastr.success(t('Transferred'));
			FlowRouter.go('/');
		} catch (error) {
			handleError(error);
		}
	}, [closeModal, forwardChat, rid, t]);

	const closeChat = useMethod('livechat:closeRoom');

	const handleClose = useCallback(async (comment: string) => {
		try {
			await closeChat(rid, comment, { clientAction: true });
			closeModal();
			toastr.success(t('Chat_closed_successfully'));
		} catch (error) {
			handleError(error);
		}
	}, [closeChat, closeModal, rid, t]);

	const openModal = useMutableCallback((id: string) => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				setModal(<ReturnChatQueueModal onMoveChat={handleMoveChat} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.Transcript:
				setModal(<TranscriptModal room={room} email={email} onRequest={handleRequestTranscript} onSend={handleSendTranscript} onDiscard={handleDiscardTranscript} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.ChatForward:
				setModal(<ForwardChatModal onForward={handleForwardChat} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.CloseChat:
				setModal(<CloseChatModal onConfirm={handleClose} onCancel={closeModal} />);
				break;
			default:
				break;
		}
	});

	const actionDefault = useMutableCallback((e) => {
		const index = e.currentTarget.getAttribute('data-quick-actions');
		const { id } = actions[index];
		openModal(id);
	});

	const hasManagerRole = useRole('livechat-manager');

	const roomOpen = room && room.open && ((room.servedBy && room.servedBy._id === uid) || hasManagerRole);

	const canForwardGuest = usePermission('transfer-livechat-guest');

	const canSendTranscript = usePermission('send-omnichannel-chat-transcript');

	const canCloseRoom = usePermission('close-others-livechat-room');

	const omnichannelRouteConfig = useOmnichannelRouteConfig();

	const hasPermissionButtons = (id: string): boolean => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				return !!roomOpen && !!omnichannelRouteConfig?.returnQueue;
			case QuickActionsEnum.ChatForward:
				return !!roomOpen && canForwardGuest;
			case QuickActionsEnum.Transcript:
				return !!email && canSendTranscript;
			case QuickActionsEnum.CloseChat:
				return !!roomOpen && canCloseRoom;
			default:
				break;
		}
		return false;
	};

	const hasPermissionGroup = useAtLeastOnePermission(
		useMemo(() => [
			'close-others-livechat-room', 'transfer-livechat-guest',
		], []),
	);

	return <ButtonGroup mi='x4' medium>
		{ visibleActions.map(({ id, color, icon, title, action = actionDefault }, index) => {
			const props = {
				id,
				icon,
				color,
				title: t(title as any),
				className,
				tabId: id,
				index,
				primary: false,
				'data-quick-actions': index,
				action,
				key: id,
			};

			if (!hasPermissionGroup || !hasPermissionButtons(id)) {
				return;
			}

			return <Header.ToolBoxAction {...props} />;
		})}
	</ButtonGroup>;
};

export default memo(QuickActions);
