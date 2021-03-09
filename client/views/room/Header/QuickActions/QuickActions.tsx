import React, { memo, useContext, useCallback, useState, useEffect } from 'react';
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


const QuickActions = ({ room, className }: { room: IRoom; className: BoxProps['className'] }): JSX.Element => {
	const setModal = useSetModal();
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions } = useContext(QuickActionsContext);
	const actions = (Array.from(mapActions.values()) as QuickActionsActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);
	const [email, setEmail] = useState('');
	const visitorRoomId = room.v?._id;

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

	const discardTranscript = (): void => Meteor.call('livechat:discardTranscript', room._id, (error: any) => {
		closeModal();
		if (error != null) {
			return handleError(error);
		}
		toastr.success(t('Livechat_transcript_request_has_been_canceled'));
	});

	const openModal = useMutableCallback((id: string) => {
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				setModal(<ReturnChatQueueModal onMoveChat={moveChat} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.Transcript:
				setModal(<TranscriptModal room={room} email={email} onSend={requestTranscript} onDiscard={discardTranscript} onCancel={closeModal} />);
				break;
			case QuickActionsEnum.ChatForward:
				setModal(<ForwardChatModal onForward={requestTranscript} onCancel={closeModal} />);
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

			return <Header.ToolBoxAction {...props} />;
		})}
	</ButtonGroup>;
};

export default memo(QuickActions);
