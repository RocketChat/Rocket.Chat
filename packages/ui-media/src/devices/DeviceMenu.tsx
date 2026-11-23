import { Box, RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeviceSelection } from './DeviceSelectionContext';
import { deviceMenuSelection } from './deviceMenuRows';

type DevicePick = { kind: MediaDeviceKind; deviceId: string; inUse: boolean };

/** One option of a choice about the devices, rather than a device. */
export type DeviceMenuChoice = {
	type: 'choice';
	id: string;
	name: string;
	/** Said on its own line, under the name. */
	note?: string;
	selected: boolean;
	disabled?: boolean;
	onSelect: () => void;
};

/** A setting turned on and off by choosing it. */
export type DeviceMenuToggle = {
	type: 'toggle';
	id: string;
	name: string;
	note?: string;
	checked: boolean;
	disabled?: boolean;
	onToggle: () => void;
};

/** Opens somewhere outside the menu, such as a settings panel. */
export type DeviceMenuAction = {
	type: 'action';
	id: string;
	name: string;
	disabled?: boolean;
	onAction: () => void;
};

export type DeviceMenuRow = DeviceMenuChoice | DeviceMenuToggle | DeviceMenuAction;

export type DeviceMenuChoices = { title: string; choices: DeviceMenuRow[] };

/** Choosing the choice already in use does nothing, rather than restart it. */
const activate = (row: DeviceMenuRow) => {
	if (row.disabled) {
		return;
	}
	switch (row.type) {
		case 'toggle':
			row.onToggle();
			return;
		case 'action':
			row.onAction();
			return;
		case 'choice':
			if (!row.selected) {
				row.onSelect();
			}
	}
};

const inUse = (row: DeviceMenuRow) => (row.type === 'toggle' && row.checked) || (row.type === 'choice' && row.selected);

const rowAddon = (row: DeviceMenuRow) => {
	switch (row.type) {
		case 'toggle':
			return <ToggleSwitch checked={row.checked} disabled={row.disabled} readOnly tabIndex={-1} aria-hidden />;
		case 'action':
			return undefined;
		case 'choice':
			return <RadioButton checked={row.selected} disabled={row.disabled} />;
	}
};

/** Keeps a choice's id apart from the device ids, which are the browser's to pick. */
const choiceKey = (sectionIndex: number, id: string) => `choice:${sectionIndex}:${id}`;

const rowContent = (name: string, note?: string) => (
	<Box title={name} fontScale='p2' display='flex' flexDirection='column' minWidth={0}>
		<Box is='span' withTruncatedText>
			{name}
		</Box>
		{note && (
			<Box is='span' fontScale='c1' color='hint'>
				{note}
			</Box>
		)}
	</Box>
);

export type DeviceMenuProps = {
	/** One section per kind, in this order. */
	kinds: MediaDeviceKind[];
	title: string;
	placement: 'top-start' | 'top-end';
	/** Awaited before the menu opens; the menu stays shut if it rejects. */
	beforeOpen?: () => Promise<void>;
	/** The trigger, which `GenericMenu` clones with the props that open the menu. */
	button: ReactElement;
	/** Sections of choices about these devices, after them. */
	choices?: DeviceMenuChoices[];
};

/** A menu of the devices of the given kinds, choosing through the nearest `DeviceSelectionProvider`. */
const DeviceMenu = ({ kinds, title, placement, beforeOpen, button, choices = [] }: DeviceMenuProps) => {
	const { t } = useTranslation();
	const selection = useDeviceSelection();
	const [isOpen, setIsOpen] = useSafely(useState(false));

	const sectionTitles: Record<MediaDeviceKind, string> = {
		audioinput: t('Microphone'),
		audiooutput: t('Speaker'),
		videoinput: t('Camera'),
	};

	const picks = new Map<string, DevicePick>();
	// Rows in use are passed as the selection, so screen readers announce them as checked.
	const selectedKeys: string[] = [];

	const sections = kinds
		.map((kind) => {
			const { rows, selected } = deviceMenuSelection(selection, kind);

			const items = rows.map((row): GenericMenuItemProps => {
				const id = `${row.id}-${kind}`;
				const name = row.name || t('Default');
				picks.set(id, { kind, deviceId: row.id, inUse: row === selected });
				if (row === selected) {
					selectedKeys.push(id);
				}

				return {
					id,
					textValue: name,
					// The system default is said on its own line, as a fact about the device rather than part of its name.
					content: rowContent(name, row.systemDefault ? t('System_default') : undefined),
					addon: <RadioButton checked={row === selected} />,
				};
			});

			return { title: sectionTitles[kind], items };
		})
		.filter(({ items }) => items.length > 0);

	const disabled = sections.length === 0;

	const choiceActions = new Map<string, DeviceMenuRow>();
	const choiceSections = choices.map(({ title, choices: rows }, sectionIndex) => ({
		title,
		items: rows.map((row): GenericMenuItemProps => {
			const id = choiceKey(sectionIndex, row.id);
			choiceActions.set(id, row);
			if (inUse(row)) {
				selectedKeys.push(id);
			}
			return {
				id,
				textValue: row.name,
				content: rowContent(row.name, row.type === 'action' ? undefined : row.note),
				disabled: row.disabled,
				addon: rowAddon(row),
			};
		}),
	}));

	const onOpenChange = (open: boolean) => {
		if (!open || !beforeOpen) {
			setIsOpen(open);
			return;
		}
		beforeOpen().then(
			() => setIsOpen(true),
			() => undefined,
		);
	};

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : title}
			sections={[...sections, ...choiceSections]}
			disabled={disabled}
			placement={placement}
			// 'multiple': one row is in use per section.
			selectionMode='multiple'
			selectedKeys={selectedKeys}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onAction={(key) => {
				// Multiple selection keeps the menu open; a menu of one device kind still closes on a choice.
				if (kinds.length === 1) {
					setIsOpen(false);
				}
				const row = choiceActions.get(String(key));
				if (row) {
					activate(row);
					return;
				}
				const pick = picks.get(String(key));
				// Switching to the device already in use restarts its track, which a camera shows as a black frame.
				if (!pick || pick.inUse) {
					return;
				}
				selection.select(pick.kind, pick.deviceId);
			}}
			button={button}
		/>
	);
};

export default DeviceMenu;
