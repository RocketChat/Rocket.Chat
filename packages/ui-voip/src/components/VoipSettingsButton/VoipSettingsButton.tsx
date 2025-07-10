/* eslint-disable react/no-multi-comp */
import { IconButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useQueryClient } from '@tanstack/react-query';
import type { ComponentProps, Ref } from 'react';
import { forwardRef, useCallback, useState } from 'react';

import { useVoipDeviceSettings } from './hooks/useVoipDeviceSettings';
import { useDevicePermissionPrompt } from '../../hooks/useDevicePermissionPrompt';

const CustomizeButton = forwardRef(function CustomizeButton(
	{ mini, ...props }: ComponentProps<typeof IconButton>,
	ref: Ref<HTMLButtonElement>,
) {
	const size = mini ? 24 : 32;
	return <IconButton {...props} ref={ref} icon='customize' mini width={size} height={size} />;
});

const VoipSettingsButton = ({ mini = false }: { mini?: boolean }) => {
	const [isOpen, setIsOpen] = useSafely(useState(false));
	const menu = useVoipDeviceSettings();

	const queryClient = useQueryClient();

	const _onOpenChange = useDevicePermissionPrompt({
		actionType: 'device-change',
		onAccept: (stream) => {
			// Firefox doesn't allow to get the media devices list without an active stream for each session.
			// This is a workaround to get the media devices list before answering the call.
			queryClient.invalidateQueries({ queryKey: ['media-devices-list'], exact: true });

			stream?.getTracks().forEach((track) => {
				track.stop();
			});

			return setIsOpen(true);
		},
		onReject: () => {
			setIsOpen(false);
		},
	});

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen) {
				_onOpenChange();
				return;
			}

			setIsOpen(isOpen);
		},
		[_onOpenChange, setIsOpen],
	);

	return (
		<GenericMenu
			is={CustomizeButton}
			title={menu.title}
			disabled={menu.disabled}
			sections={menu.sections}
			selectionMode='multiple'
			placement='top-end'
			icon='customize'
			mini={mini}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
		/>
	);
};

export default VoipSettingsButton;
