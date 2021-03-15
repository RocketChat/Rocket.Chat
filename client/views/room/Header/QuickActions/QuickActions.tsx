import React, { memo, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { BoxProps, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import toastr from 'toastr';

import Header from '../../../../components/Header';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { QuickActionsActionConfig, QuickActionsEnum } from '../../lib/QuickActions';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { QuickActionsContext } from '../../lib/QuickActions/QuickActionsContext';
import ReturnChatQueueModal from '../../../../components/ReturnChatQueueModal';
import ForwardChatModal from '../../../../components/ForwardChatModal';
import TranscriptModal from '../../../../components/TranscriptModal';
import { handleError } from '../../../../../app/utils/client';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';
import { IRoom } from '../../../../../definition/IRoom';
import { useAtLeastOnePermission, usePermission, useRole } from '../../../../contexts/AuthorizationContext';
import { useUserId } from '../../../../contexts/UserContext';
import { useOmnichannel } from '../../../../contexts/OmnichannelContext';

const QuickActions = ({ room, className }: { room: IRoom; className: BoxProps['className'] }): JSX.Element => {
	const setModal = useSetModal();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions } = useContext(QuickActionsContext);
	const actions = (Array.from(mapActions.values()) as QuickActionsActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);
	const [email, setEmail] = useState('');
	const visitorRoomId = room.v?._id;
	const uid = useUserId();

	const getVisitorInfo = useEndpointAction('GET', `livechat/visitors.info?visitorId=${ visitorRoomId }`);

	const getVisitorEmail = useMutableCallback(async () => {
		if (!visitorRoomId) { return; }
		const { visitor: { visitorEmails } } = await getVisitorInfo();
		setEmail(visitorEmails && visitorEmails.length > 0 && visitorEmails[0].address);
	});

	useEffect(() => {
		getVisitorEmail();
	}, [room, getVisitorEmail]);

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const moveChat = (): void => Meteor.call('livechat:returnAsInquiry', room._id, function(error: any) {
		closeModal();
		if (error) {
			return handleError(error);
		}

		Session.set('openedRoom', null);
		FlowRouter.go('/home');
	});

	const requestTranscript = (email: string, subject: string): void => Meteor.call('livechat:requestTranscript', room._id, email, subject, (err: any) => {
		closeModal();
		if (err != null) {
			return handleError(err);
		}
		toastr.success(t('Livechat_transcript_has_been_requested'));
		Session.set('openedRoom', null);
	});

	const sendTranscript = (email: string, subject: string, token: string): void => Meteor.call('livechat:sendTranscript', token, room._id, email, subject, (err: any) => {
		closeModal();
		if (err != null) {
			return handleError(err);
		}

		toastr.success(t('Your_email_has_been_queued_for_sending'));
	});

	const discardTranscript = (): void => Meteor.call('livechat:discardTranscript', room._id, (error: any) => {
		closeModal();
		if (error != null) {
			return handleError(error);
		}
		toastr.success(t('Livechat_transcript_request_has_been_canceled'));
	});

	const forwardChat = (departmentId?: string, userId?: string, comment?: string): void => {
		console.log(departmentId, userId, comment);
		if (departmentId && userId) {
			return;
		}
		const transferData: { roomId: string; comment?: string; departmentId?: string; userId?: string } = {
			roomId: room._id,
			comment,
		};


		if (departmentId) { transferData.departmentId = departmentId; }
		if (userId) { transferData.userId = userId; }

		Meteor.call('livechat:transfer', transferData, (error: any, result: any) => {
			if (error) {
				toastr.error(t(error.error));
			} else if (result) {
				closeModal();
				toastr.success(t('Transferred'));
				FlowRouter.go('/');
			} else {
				toastr.warning(t('No_available_agents_to_transfer'));
			}
		});
	};

	const openModal = useMutableCallback((id: string) => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				setModal(<ReturnChatQueueModal onMoveChat={moveChat} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.Transcript:
				setModal(<TranscriptModal room={room} email={email} onRequest={requestTranscript} onSend={sendTranscript} onDiscard={discardTranscript} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.ChatForward:
				setModal(<ForwardChatModal onForward={forwardChat} onCancel={closeModal} />);
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

	const canReturnQueue = useOmnichannel().routeConfig?.returnQueue;

	const hasPermissionButtons = (id: string): boolean => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				return !!roomOpen && !!canReturnQueue;
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
				title: t(title),
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
