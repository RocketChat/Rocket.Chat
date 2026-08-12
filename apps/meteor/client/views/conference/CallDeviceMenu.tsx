import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Dropdown, Icon, Option, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useDropdownVisibility } from '../room/Header/Omnichannel/QuickActions/hooks/useDropdownVisibility';

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
 * The device on the left, its name beside it, the chevron pushed to the far right — a control that says what it
 * is, what it is set to, and that there is more behind it, read left to right.
 *
 * Built on a plain button rather than `GenericMenu` because that one clones its trigger: it injects its own
 * chevron as a *leading* icon and replaces the button's `className`, so neither the icon's place nor the name's
 * alignment was ours to set. Owning the open state is also what lets the chevron turn over when it opens.
 */
const triggerStyles = css`
	width: 100%;
	min-width: 0;

	& > .rcx-button--content {
		display: flex;
		width: 100%;
		min-width: 0;
		align-items: center;
		justify-content: flex-start;
		gap: 6px;
	}
`;

const nameStyles = css`
	overflow: hidden;
	flex-grow: 1;
	text-align: left;
	white-space: nowrap;
	text-overflow: ellipsis;
`;

/**
 * Picks which camera, microphone or speaker to arrive on, from the preflight.
 *
 * Separate from `ui-voip`'s in-call pickers on purpose: those dispatch through the call's own view context to
 * switch a device mid-call, and there is no call here yet. This one only records a choice for the join to carry.
 */
const CallDeviceMenu = ({ icon, label, devices, selectedId, onSelect }: CallDeviceMenuProps) => {
	const { t } = useTranslation();

	const reference = useRef<HTMLButtonElement>(null);
	const target = useRef<HTMLElement>(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

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

	const currentId = selectedId ?? ordered[0]?.deviceId;
	const current = ordered.find(({ deviceId }) => deviceId === currentId);

	return (
		<Box display='flex' alignItems='center' minWidth={0}>
			<Button
				ref={reference}
				small
				className={triggerStyles}
				aria-label={label}
				aria-haspopup='listbox'
				aria-expanded={isVisible}
				title={current ? deviceName(current.label) : label}
				disabled={!ordered.length}
				onClick={() => toggle()}
			>
				<Icon name={icon} size='x16' flexShrink={0} />
				<Box className={nameStyles}>{current ? deviceName(current.label) || t('Default') : label}</Box>
				<Icon name={isVisible ? 'chevron-up' : 'chevron-down'} size='x16' flexShrink={0} />
			</Button>

			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='top-start'>
					{ordered.map((device) => (
						<Option
							key={device.deviceId}
							selected={device.deviceId === currentId}
							onClick={() => {
								onSelect(device.deviceId);
								toggle(false);
							}}
						>
							<OptionContent>
								{/* A device the browser hasn't named yet — permission was granted after it was enumerated. */}
								<Box withTruncatedText>{deviceName(device.label) || t('Default')}</Box>
								{device.deviceId === 'default' && (
									<Box fontScale='c1' color='hint'>
										{t('System')} {t('Default').toLowerCase()}
									</Box>
								)}
							</OptionContent>
							{device.deviceId === currentId && (
								<OptionColumn>
									<Icon name='check' size='x20' color='status-font-on-info' />
								</OptionColumn>
							)}
						</Option>
					))}
				</Dropdown>
			)}
		</Box>
	);
};

export default CallDeviceMenu;
