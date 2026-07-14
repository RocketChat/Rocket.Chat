import { createContext, useContext } from 'react';

export type MediaCallWidgetSlotContextValue = {
	slot: HTMLElement | null;
	inline: boolean;
	setSlot: (element: HTMLElement | null) => void;
};

const defaultValue: MediaCallWidgetSlotContextValue = {
	slot: null,
	inline: false,
	setSlot: () => undefined,
};

const MediaCallWidgetSlotContext = createContext<MediaCallWidgetSlotContextValue>(defaultValue);

export const useMediaCallWidgetSlot = (): MediaCallWidgetSlotContextValue => useContext(MediaCallWidgetSlotContext);

export default MediaCallWidgetSlotContext;
