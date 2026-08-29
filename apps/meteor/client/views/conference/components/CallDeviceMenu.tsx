import { css } from '@rocket.chat/css-in-js';
import { Box, Button, Dropdown, Icon, Option, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from '@rocket.chat/ui-voip';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useDropdownVisibility } from '../../room/Header/Omnichannel/QuickActions/hooks/useDropdownVisibility';

type Choice = { id: string; name: string; note?: string };

type CallDeviceMenuProps = {
	icon: IconName;
	label: string;
	/** The devices to choose between. Ignored when `choices` is given. */
	devices?: MediaDeviceInfo[];
	selectedId?: string;
	onSelect: (deviceId: string) => void;
	/**
	 * Further groups of choices under the devices, in the same dropdown: what to do about noise, how much detail to
	 * send, how much to blur. They belong to the device they are about — noise is a fact about the microphone, blur
	 * about the camera — so they live behind the same control rather than in a row of their own, which is also where
	 * the call itself puts them.
	 */
	sections?: { title: string; choices: Choice[]; selectedId?: string; onSelect: (id: string) => void }[];
};

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
const CallDeviceMenu = ({ icon, label, devices, selectedId, onSelect, sections }: CallDeviceMenuProps) => {
	const { t } = useTranslation();

	const reference = useRef<HTMLButtonElement>(null);
	const target = useRef<HTMLElement>(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	// Devices and plain choices are reduced to the same three fields, so everything below draws one kind of row.
	// Devices go through `orderDevices` first, shared with the in-call pickers, so a device is named and ordered the
	// same way before a call and inside one.
	const rows = useMemo((): Choice[] => {
		return orderDevices(devices ?? []).map((device) => ({
			id: device.deviceId,
			// A device the browser hasn't named yet — permission was granted after it was enumerated.
			name: deviceName(device.label),
			...(device.deviceId === SYSTEM_DEFAULT_DEVICE_ID && { note: 'system-default' }),
		}));
	}, [devices]);

	const currentId = selectedId ?? rows[0]?.id;
	const current = rows.find(({ id }) => id === currentId);

	const renderRow = (row: Choice, isCurrent: boolean, choose: () => void) => (
		<Option
			key={row.id}
			selected={isCurrent}
			onClick={() => {
				choose();
				toggle(false);
			}}
		>
			<OptionContent>
				<Box withTruncatedText>{row.name || t('Default')}</Box>
				{row.note && (
					<Box fontScale='c1' color='hint'>
						{row.note === 'system-default' ? `${t('System')} ${t('Default').toLowerCase()}` : t(row.note as 'Default')}
					</Box>
				)}
			</OptionContent>
			{isCurrent && (
				<OptionColumn>
					<Icon name='check' size='x20' color='status-font-on-info' />
				</OptionColumn>
			)}
		</Option>
	);

	return (
		<Box display='flex' alignItems='center' minWidth={0}>
			<Button
				ref={reference}
				small
				className={triggerStyles}
				aria-label={label}
				aria-haspopup='listbox'
				aria-expanded={isVisible}
				title={current?.name || label}
				disabled={!rows.length}
				onClick={() => toggle()}
			>
				<Icon name={icon} size='x16' flexShrink={0} />
				<Box className={nameStyles}>{current?.name || label}</Box>
				<Icon name={isVisible ? 'chevron-up' : 'chevron-down'} size='x16' flexShrink={0} />
			</Button>

			{isVisible && (
				<Dropdown reference={reference} ref={target} placement='top-start'>
					{rows.map((row) => renderRow(row, row.id === currentId, () => onSelect(row.id)))}

					{sections?.map((section) => (
						<Box key={section.title}>
							{/* A heading, because a list that runs from microphones straight into "no blur" reads as one
							    list of increasingly strange devices. */}
							<Box paddingInline={16} paddingBlockStart={8} paddingBlockEnd={4} fontScale='micro' color='hint'>
								{section.title}
							</Box>
							{section.choices.map((choice) =>
								renderRow(choice, choice.id === (section.selectedId ?? section.choices[0]?.id), () => section.onSelect(choice.id)),
							)}
						</Box>
					))}
				</Dropdown>
			)}
		</Box>
	);
};

export default CallDeviceMenu;
