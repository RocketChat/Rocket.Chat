import { MessageComposerDisabled, MessageComposerDisabledAction, MessageComposerDisabledDivider } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

export const ComposerJoinWithPassword = (): ReactElement => {
	const t = useTranslation();

	// <div class="rc-message-box__join">
	//     {{{_ "you_are_in_preview_mode_of" room_name=roomName}}}

	//     {{#if isJoinCodeRequired}}
	//     <input type="password" name="joinCode" placeholder="{{_ 'Password'}}" class="rc-input__element rc-message-box__join-code">
	//     {{/if}}

	//     <button class="rc-button rc-button--primary rc-button--small rc-message-box__join-button js-join-code">{{_ "join"}}</button>
	// </div>

	// async 'click .js-join-code'(event: JQuery.ClickEvent) {
	// 	event.stopPropagation();
	// 	event.preventDefault();

	// 	const joinCodeInput = Template.instance().find('[name=joinCode]') as HTMLInputElement;
	// 	const joinCode = joinCodeInput?.value;

	// 	await call('joinRoom', this.rid, joinCode);

	// 	if (hasAllPermission('preview-c-room') === false && RoomHistoryManager.getRoom(this.rid).loaded === 0) {
	// 		const openedRoom = RoomManager.getOpenedRoomByRid(this.rid);
	// 		if (openedRoom) {
	// 			openedRoom.streamActive = false;
	// 			openedRoom.ready = false;
	// 		}
	// 		RoomHistoryManager.getRoom(this.rid).loaded = undefined;
	// 		RoomManager.computation.invalidate();
	// 	}
	// },

	return (
		<MessageComposerDisabled>
			{t('you_are_in_preview_mode_of')}
			<MessageComposerDisabledDivider />
			<MessageComposerDisabledAction>{t('Join_with_password')}</MessageComposerDisabledAction>{' '}
		</MessageComposerDisabled>
	);
};
