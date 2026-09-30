import { Box, RadioButton } from '@rocket.chat/fuselage';
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
	id: string;
	name: string;
	/** Said on its own line, under the name. */
	note?: string;
	/** Left out for an action rather than an option, such as opening a file picker. */
	selected?: boolean;
	disabled?: boolean;
	onSelect: () => void;
};

/** A section of choices about the devices, shown under the devices themselves. */
export type DeviceMenuChoices = { title: string; choices: DeviceMenuChoice[] };

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

	const sections = kinds
		.map((kind) => {
			const { rows, selected } = deviceMenuSelection(selection, kind);

			const items = rows.map((row): GenericMenuItemProps => {
				const id = `${row.id}-${kind}`;
				const name = row.name || t('Default');
				picks.set(id, { kind, deviceId: row.id, inUse: row === selected });

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

	const choiceActions = new Map<string, DeviceMenuChoice>();
	const choiceSections = choices.map(({ title, choices: options }, sectionIndex) => ({
		title,
		items: options.map((choice): GenericMenuItemProps => {
			const id = choiceKey(sectionIndex, choice.id);
			choiceActions.set(id, choice);
			return {
				id,
				textValue: choice.name,
				content: rowContent(choice.name, choice.note),
				addon: choice.selected === undefined ? undefined : <RadioButton checked={choice.selected} disabled={choice.disabled} />,
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
			selectionMode={kinds.length > 1 ? 'multiple' : 'single'}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onAction={(key) => {
				const choice = choiceActions.get(String(key));
				if (choice) {
					if (!choice.selected && !choice.disabled) {
						choice.onSelect();
					}
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
