import React, { memo, useContext, useCallback } from 'react';
import { BoxProps, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';

import Header from '../../../../components/Header';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { QuickActionsActionConfig, QuickActionsEnum } from '../../lib/QuickActions';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useSetModal } from '../../../../contexts/ModalContext';
import { QuickActionsContext } from '../../lib/QuickActions/QuickActionsContext';
import ReturnChatQueueModal from '../../../../components/ReturnChatQueueModal';
import { useSession } from '../../../../contexts/SessionContext';
import { handleError } from '../../../../../app/utils/client';


const QuickActions = ({ className }: { className: BoxProps['className'] }): JSX.Element => {
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { actions: mapActions } = useContext(QuickActionsContext);
	const actions = (Array.from(mapActions.values()) as QuickActionsActionConfig[]).sort((a, b) => (a.order || 0) - (b.order || 0));
	const visibleActions = isMobile ? [] : actions.slice(0, 6);
	const setModal = useSetModal();
	const currentRoom = useSession('openedRoom');

	const closeModal = useCallback(() => setModal(null), [setModal]);

	const moveChat = (): void => Meteor.call('livechat:returnAsInquiry', currentRoom, function(error: any) {
		if (error) {
			handleError(error);
		} else {
			Session.set('openedRoom', null);
			FlowRouter.go('/home');
		}
		closeModal();
	});

	const openModal = useMutableCallback((id: string) => {
		console.log(id);
		console.log('room: ', currentRoom);
		switch (id) {
			case QuickActionsEnum.MoveQueue:
				setModal(<ReturnChatQueueModal onMoveChat={moveChat} onCancel={closeModal} />);
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
