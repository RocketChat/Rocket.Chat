import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type CallDeviceMenuProps = {
	icon: IconName;
	label: string;
	devices: MediaDeviceInfo[];
	selectedId?: string;
	onSelect: (deviceId: string) => void;
};

/**
 * Browsers dress a device's name up twice over: the USB vendor:product pair identifies the hardware to the
 * machine rather than to the person choosing it — "Display Audio (05ac:1107)" — and the one the system prefers
 * is prefixed "Default - ". Both are dropped from the name, and the prefix is said properly instead, on its own
 * line where it reads as a fact about the device rather than part of what it is called.
 *
 * A parenthetical like "(Built-in)" stays: that is part of the name.
 */
const deviceName = (label: string): string =>
	label
		.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '')
		.replace(/^Default\s+-\s+/i, '')
		.trim();

/**
 * One line, ellipsised: a device name is long, and a trigger that grows to fit one breaks the row of three.
 *
 * `Menu` clones this button and injects its own chevron as the leading icon, so the name is the only child —
 * putting a second icon inside fought that and wrapped the label onto its own line. The class goes on the menu
 * rather than the button for the same reason: the clone replaces the button's own `className`.
 */
const triggerStyles = css`
	/* Fills its grid column, so the three read as one set rather than three different-sized pills. */
	width: 100%;
	min-width: 0;
	justify-content: flex-start;

	& > .rcx-button--content {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`;

/**
 * Picks which camera, microphone or speaker to arrive on, from the preflight.
 *
 * Separate from `ui-voip`'s in-call pickers on purpose: those dispatch through the call's own view context to
 * switch a device mid-call, and there is no call here yet. This one only records a choice for the join to carry.
 *
 * It names the device on the button rather than hiding it behind a chevron, because the whole reason to look
 * here is to check *which* one is about to be used — and with nothing chosen it shows the first, since that is
 * what the browser will hand over.
 */
const CallDeviceMenu = ({ icon, label, devices, selectedId, onSelect }: CallDeviceMenuProps) => {
	const { t } = useTranslation();

	const currentId = selectedId ?? devices.find(({ deviceId }) => deviceId === 'default')?.deviceId ?? devices[0]?.deviceId;
	const current = devices.find(({ deviceId }) => deviceId === currentId);

	/**
	 * Browsers list the system default *twice*: once as the `default` alias, and again under its own id. Both
	 * name the same hardware, so offering both is offering the same choice twice. The alias is the one kept —
	 * it is what "leave it to the system" means, and it follows the system if that changes — and its twin is
	 * found by `groupId`, which the two share. Matching on the name instead would collapse genuinely different
	 * devices that happen to be called the same thing, which two displays generally are.
	 *
	 * The default then goes first: it is the one that will be used if nothing is picked, so it is the one that
	 * should already be under the cursor.
	 */
	const ordered = useMemo(() => {
		const systemDefault = devices.find(({ deviceId }) => deviceId === 'default');

		const rest = devices.filter(
			(device) => device !== systemDefault && !(systemDefault && device.groupId && device.groupId === systemDefault.groupId),
		);

		return systemDefault ? [systemDefault, ...rest] : rest;
	}, [devices]);

	const items = useMemo(
		(): GenericMenuItemProps[] =>
			ordered.map((device) => ({
				id: device.deviceId,
				content: (
					<Box>
						{/* A device the browser hasn't named yet — permission was granted after it was enumerated. */}
						<Box>{deviceName(device.label) || t('Default')}</Box>
						{device.deviceId === 'default' && (
							<Box fontScale='c1' color='hint'>
								{t('System')} {t('Default').toLowerCase()}
							</Box>
						)}
					</Box>
				),
				addon: device.deviceId === currentId ? <Icon name='check' size='x20' color='status-font-on-info' /> : undefined,
				onClick: () => onSelect(device.deviceId),
			})),
		[ordered, currentId, onSelect, t],
	);

	// Shares the row evenly with its siblings and truncates, rather than pushing one onto a second line.
	return (
		<Box display='flex' alignItems='center' minWidth={0} style={{ gap: 4 }}>
			<Icon name={icon} size='x16' color='hint' aria-hidden flexShrink={0} />
			<GenericMenu
				title={label}
				icon='chevron-down'
				placement='top-start'
				className={triggerStyles}
				disabled={!devices.length}
				items={items}
				button={
					<Button small aria-label={label} title={current ? deviceName(current.label) : label}>
						{current ? deviceName(current.label) || t('Default') : label}
					</Button>
				}
			/>
		</Box>
	);
};

export default CallDeviceMenu;
