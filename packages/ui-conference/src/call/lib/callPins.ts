import type { ScreenShare } from './screenShares';

export type CallPin = { kind: 'person' | 'screen'; id: string };

/** `screensDismissed`: the reader unpinned the share on the stage, so shares stay off it until they pin one or nobody shares. */
export type CallPins = { pin: CallPin | null; screensDismissed: boolean };

export const NO_PINS: CallPins = { pin: null, screensDismissed: false };

export const SCREENS_DISMISSED: CallPins = { pin: null, screensDismissed: true };

export const pinnedIdOf = ({ pin }: CallPins, kind: CallPin['kind']): string | null => (pin?.kind === kind ? pin.id : null);

export const unpinPerson = (pins: CallPins, id: string): CallPins => (pinnedIdOf(pins, 'person') === id ? { ...pins, pin: null } : pins);

export const togglePersonPin = (pins: CallPins, id: string): CallPins =>
	pinnedIdOf(pins, 'person') === id ? { ...pins, pin: null } : { ...pins, pin: { kind: 'person', id } };

export const pinScreen = (id: string): CallPins => ({ pin: { kind: 'screen', id }, screensDismissed: false });

/** A pinned share that stopped ends its pin; once nobody shares, the next share is welcome on the stage again. */
export const pinsForShares = ({ pin, screensDismissed }: CallPins, shares: ScreenShare[]): CallPins => ({
	pin: pin?.kind === 'screen' && !shares.some(({ id }) => id === pin.id) ? null : pin,
	screensDismissed: screensDismissed && shares.length > 0,
});
