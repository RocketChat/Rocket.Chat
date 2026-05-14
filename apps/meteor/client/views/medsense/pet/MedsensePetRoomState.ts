import { useSyncExternalStore } from 'react';

export type MedsensePetRoomState = {
	currentRoomId?: string;
	currentRoomName?: string;
	routeName?: string;
	activeRequestId?: string;
	activeRequestStatus?: string;
	assigned?: string;
	isRoomView: boolean;
	roomActions?: {
		id: string;
		title: string;
		action: () => void;
	}[];
	openRequestManagement?: () => void;
};

const defaultState: MedsensePetRoomState = {
	isRoomView: false,
};

let currentState = defaultState;
const listeners = new Set<() => void>();

const emit = () => {
	listeners.forEach((listener) => listener());
};

export const setMedsensePetRoomState = (nextState: MedsensePetRoomState): void => {
	currentState = nextState;
	emit();
};

export const clearMedsensePetRoomState = (roomId?: string): void => {
	if (roomId && currentState.currentRoomId !== roomId) {
		return;
	}

	currentState = defaultState;
	emit();
};

export const getMedsensePetRoomState = (): MedsensePetRoomState => currentState;

export const subscribeToMedsensePetRoomState = (listener: () => void): (() => void) => {
	listeners.add(listener);

	return () => listeners.delete(listener);
};

export const useMedsensePetRoomState = (): MedsensePetRoomState =>
	useSyncExternalStore(subscribeToMedsensePetRoomState, getMedsensePetRoomState);
