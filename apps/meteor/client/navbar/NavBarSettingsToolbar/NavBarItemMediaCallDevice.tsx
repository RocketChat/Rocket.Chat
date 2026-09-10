import { Box, NavBarItem, RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch, useUser } from '@rocket.chat/ui-contexts';
import { useMediaCallDevices, usePeekMediaSessionState } from '@rocket.chat/ui-voip';
import { useMutation } from '@tanstack/react-query';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

export type NavBarItemMediaCallDeviceProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

/** Stands for taking calls in Rocket.Chat itself, which is the absence of a device rather than one of them. */
const ROCKET_CHAT = 'rocket.chat';

const menuItem = (id: string, label: string, checked: boolean, disabled: boolean): GenericMenuItemProps => ({
	id,
	disabled,
	content: (
		<Box is='span' title={label} fontSize={14}>
			{label}
		</Box>
	),
	addon: <RadioButton checked={checked} disabled={disabled} />,
});

/**
 * Lets the user say where their calls happen: in Rocket.Chat, or on one of the external devices an app
 * offers them. The choice is kept on the user, so it holds until they change it.
 *
 * It is locked while a call is up, because the choice decides both where calls are placed and which
 * ones are answered, and moving it under a live call has no sensible meaning.
 */
const NavBarItemMediaCallDevice = (props: NavBarItemMediaCallDeviceProps) => {
	const { t } = useTranslation();
	const user = useUser();
	const devices = useMediaCallDevices();
	const callState = usePeekMediaSessionState();
	const dispatchToastMessage = useToastMessageDispatch();

	const selectDevice = useEndpoint('POST', '/v1/media-calls.selectDevice');

	const { mutate: chooseDevice } = useMutation({
		mutationFn: async (deviceId: string | null) => selectDevice(deviceId ? { deviceId } : {}),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const selected = user?.mediaCallDevice ?? null;
	const busy = ['ongoing', 'ringing', 'calling'].includes(callState);

	// Nothing to choose between: no app offers this user a device and they are not already on one.
	if (!devices.length && !selected) {
		return null;
	}

	// The chosen device is listed even when no app currently offers it — an app can be uninstalled or
	// disabled while a user is still pointed at one of its devices, and they need to see that and leave it.
	const knownDevices =
		selected && !devices.some(({ id }) => id === selected.id) ? [{ ...selected, name: selected.name ?? selected.id }, ...devices] : devices;

	const items = [
		menuItem(ROCKET_CHAT, 'Rocket.Chat', !selected, busy),
		...knownDevices.map((device) => menuItem(device.id, device.name, selected?.id === device.id, busy)),
	];

	return (
		<GenericMenu
			items={items}
			title={busy ? t('Call_device_locked_during_call') : t('Call_device')}
			is={NavBarItem}
			icon='phone'
			placement='bottom-end'
			onAction={(id) => {
				if (typeof id !== 'string' || busy) {
					return;
				}

				const deviceId = id === ROCKET_CHAT ? null : id;
				if (deviceId === (selected?.id ?? null)) {
					return;
				}

				chooseDevice(deviceId);
			}}
			{...props}
		/>
	);
};

export default NavBarItemMediaCallDevice;
