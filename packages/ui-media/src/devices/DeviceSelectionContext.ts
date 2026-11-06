import { createRequiredContext } from '../createRequiredContext';

/**
 * The devices on offer and which one is in use for each kind, for the device menus. The preflight fills it with the
 * reader's stored choices; a call running in this window, with what its room has open.
 */
export type DeviceSelection = {
	/** Every camera, microphone and speaker the browser lists, kept current as devices come and go. */
	devices: MediaDeviceInfo[];
	/** The device in use for each kind. With none, the first on offer is. */
	selectedIds: Partial<Record<MediaDeviceKind, string>>;
	select: (kind: MediaDeviceKind, deviceId: string) => void;
};

export const [DeviceSelectionProvider, useDeviceSelection] = createRequiredContext<DeviceSelection>('DeviceSelection');
