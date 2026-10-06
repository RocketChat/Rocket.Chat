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

export type DeviceMenuProps = {
	/** One section per kind, in this order. */
	kinds: MediaDeviceKind[];
	title: string;
	placement: 'top-start' | 'top-end';
	/** Awaited before the menu opens; the menu stays shut if it rejects. */
	beforeOpen?: () => Promise<void>;
	/** The trigger, which `GenericMenu` clones with the props that open the menu. */
	button: ReactElement;
};

/** A menu of the devices of the given kinds, choosing through the nearest `DeviceSelectionProvider`. */
const DeviceMenu = ({ kinds, title, placement, beforeOpen, button }: DeviceMenuProps) => {
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
					content: (
						<Box title={name} fontScale='p2' display='flex' flexDirection='column' minWidth={0}>
							<Box is='span' withTruncatedText>
								{name}
							</Box>
							{/* Said on its own line, as a fact about the device rather than part of its name. */}
							{row.systemDefault && (
								<Box is='span' fontScale='c1' color='hint'>
									{t('System_default')}
								</Box>
							)}
						</Box>
					),
					addon: <RadioButton checked={row === selected} />,
				};
			});

			return { title: sectionTitles[kind], items };
		})
		.filter(({ items }) => items.length > 0);

	const disabled = sections.length === 0;

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
			sections={sections}
			disabled={disabled}
			placement={placement}
			selectionMode={kinds.length > 1 ? 'multiple' : 'single'}
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onAction={(key) => {
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
