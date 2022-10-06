import { IRoom } from '@rocket.chat/core-typings';
import { useLayout, usePermission, useSetting, useUser, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { AutoTranslate } from '../../../../../app/autotranslate/client';
import { createMessageContext } from '../../../../../app/ui-utils/client/lib/messageContext';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useRoomSubscription } from '../../contexts/RoomContext';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const useMessageContext = (room: IRoom) => {
	const uid = useUserId();
	const user = useUser() ?? undefined;
	const rid = room._id;
	const subscription = useRoomSubscription();
	const { isEmbedded: embeddedLayout, isMobile: mobile } = useLayout();
	const translateLanguage = useReactiveValue(useCallback(() => AutoTranslate.getLanguage(rid), [rid]));
	const autoImageLoad = useUserPreference('autoImageLoad');
	const useLegacyMessageTemplate = useUserPreference('useLegacyMessageTemplate');
	const saveMobileBandwidth = useUserPreference('saveMobileBandwidth');
	const collapseMediaByDefault = useUserPreference('collapseMediaByDefault');
	const hasPermissionDeleteMessage = usePermission('delete-message', rid);
	const hasPermissionDeleteOwnMessage = usePermission('delete-own-message');
	const displayRoles = useSetting('UI_DisplayRoles');
	const hideRoles = useUserPreference('hideRoles');
	const useRealName = useSetting('UI_Use_Real_Name');
	const chatopsUsername = useSetting('Chatops_Username');
	const autoTranslateEnabled = useSetting('AutoTranslate_Enabled');
	const allowEditing = useSetting('Message_AllowEditing');
	const blockEditInMinutes = useSetting('Message_AllowEditing_BlockEditInMinutes');
	const showEditedStatus = useSetting('Message_ShowEditedStatus');
	const embed = useSetting('API_Embed');
	const embedDisabledFor = useSetting('API_EmbedDisabledFor');
	const groupingPeriod = useSetting('Message_GroupingPeriod') as number;

	return useMemo(
		() =>
			createMessageContext({
				uid,
				user,
				rid,
				room,
				subscription,
				instance: () => undefined,
				embeddedLayout,
				translateLanguage,
				autoImageLoad,
				useLegacyMessageTemplate,
				saveMobileBandwidth: mobile && saveMobileBandwidth,
				collapseMediaByDefault,
				showreply: true,
				showReplyButton: true,
				hasPermissionDeleteMessage,
				hasPermissionDeleteOwnMessage,
				hideRoles: !displayRoles || hideRoles,
				UI_Use_Real_Name: useRealName,
				Chatops_Username: chatopsUsername,
				AutoTranslate_Enabled: autoTranslateEnabled,
				Message_AllowEditing: allowEditing,
				Message_AllowEditing_BlockEditInMinutes: blockEditInMinutes,
				Message_ShowEditedStatus: showEditedStatus,
				API_Embed: embed,
				API_EmbedDisabledFor: embedDisabledFor,
				Message_GroupingPeriod: groupingPeriod * 1000,
			}),
		[
			allowEditing,
			autoImageLoad,
			autoTranslateEnabled,
			blockEditInMinutes,
			chatopsUsername,
			collapseMediaByDefault,
			displayRoles,
			embed,
			embedDisabledFor,
			embeddedLayout,
			groupingPeriod,
			hasPermissionDeleteMessage,
			hasPermissionDeleteOwnMessage,
			hideRoles,
			mobile,
			rid,
			room,
			saveMobileBandwidth,
			showEditedStatus,
			subscription,
			translateLanguage,
			uid,
			useLegacyMessageTemplate,
			useRealName,
			user,
		],
	);
};
