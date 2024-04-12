import type { IExperimentalHTMLAudioElement } from '@rocket.chat/ui-contexts';

export const isSetSinkIdAvailable = (): boolean => {
	const audio = new Audio() as IExperimentalHTMLAudioElement;
	return !!audio.setSinkId;
};
