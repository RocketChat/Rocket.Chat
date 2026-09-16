import { Box, RadioButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useMediaCallView } from '../context/MediaCallViewContext';

export type CallDeviceSelectorButtonProps = {
	secondary?: boolean;
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// GenericMenu passes `small: true` when the button is disabled; drop it so the button keeps its size.
const CallDeviceSelectorButton = forwardRef<HTMLButtonElement, CallDeviceSelectorButtonProps>(function CallDeviceSelectorButton(
	{ secondary = false, small: _small, ...props },
	ref,
) {
	return <ActionButton secondary={secondary} flexShrink={1} flexGrow={0} {...props} label='phone' icon='phone' ref={ref} />;
});

const menuItem = (id: string, label: string, checked: boolean): GenericMenuItemProps => ({
	id,
	content: (
		<Box is='span' title={label} fontSize={14}>
			{label}
		</Box>
	),
	addon: <RadioButton checked={checked} />,
});

const RC_DEVICE_ID = 'rocket.chat';

export type CallDeviceSelectorProps = { secondary?: boolean; className?: string };

/**
 * Lets the user choose which endpoint an outgoing call is placed on: the Rocket.Chat client (webrtc)
 * or one of the external devices (e.g. desk phones) an app provides. Renders nothing when no external
 * devices are available.
 */
// eslint-disable-next-line react/no-multi-comp
const CallDeviceSelector = ({ secondary = false, className }: CallDeviceSelectorProps) => {
	const { t } = useTranslation();

	const { callDevices, selectedCallDevice, onSelectCallDevice } = useMediaCallView();

	if (!callDevices.length) {
		return null;
	}

	const items: GenericMenuItemProps[] = [
		menuItem(RC_DEVICE_ID, 'Rocket.Chat', selectedCallDevice === null),
		...callDevices.map((device) => menuItem(device.id, device.name, selectedCallDevice === device.id)),
	];

	return (
		<GenericMenu
			title={t('Call_using')}
			items={items}
			placement='top-end'
			selectionMode='multiple'
			className={className}
			onAction={(id) => {
				if (typeof id !== 'string') {
					return;
				}
				onSelectCallDevice(id === RC_DEVICE_ID ? null : id);
			}}
			button={<CallDeviceSelectorButton secondary={secondary} tiny={!secondary} />}
		/>
	);
};

export default CallDeviceSelector;
