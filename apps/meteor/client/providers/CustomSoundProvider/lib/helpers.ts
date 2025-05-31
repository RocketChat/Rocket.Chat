import type { ICustomSound } from '@rocket.chat/core-typings';

import { getURL } from '../../../../app/utils/client';

export const getAssetUrl = (asset: string, params?: Record<string, any>) => getURL(asset, params, undefined, true);

export const getCustomSoundURL = (sound: ICustomSound) => {
	return getAssetUrl(`/custom-sounds/${sound._id}.${sound.extension}`, { _dc: sound.random || 0 });
};

export const defaultSounds: ICustomSound[] = [
	{ _id: 'chime', name: 'Chime', extension: 'mp3', src: getAssetUrl('sounds/chime.mp3') },
	{ _id: 'door', name: 'Door', extension: 'mp3', src: getAssetUrl('sounds/door.mp3') },
	{ _id: 'beep', name: 'Beep', extension: 'mp3', src: getAssetUrl('sounds/beep.mp3') },
	{ _id: 'chelle', name: 'Chelle', extension: 'mp3', src: getAssetUrl('sounds/chelle.mp3') },
	{ _id: 'ding', name: 'Ding', extension: 'mp3', src: getAssetUrl('sounds/ding.mp3') },
	{ _id: 'droplet', name: 'Droplet', extension: 'mp3', src: getAssetUrl('sounds/droplet.mp3') },
	{ _id: 'highbell', name: 'Highbell', extension: 'mp3', src: getAssetUrl('sounds/highbell.mp3') },
	{ _id: 'seasons', name: 'Seasons', extension: 'mp3', src: getAssetUrl('sounds/seasons.mp3') },
	{ _id: 'telephone', name: 'Telephone', extension: 'mp3', src: getAssetUrl('sounds/telephone.mp3') },
	{ _id: 'outbound-call-ringing', name: 'Outbound Call Ringing', extension: 'mp3', src: getAssetUrl('sounds/outbound-call-ringing.mp3') },
	{ _id: 'call-ended', name: 'Call Ended', extension: 'mp3', src: getAssetUrl('sounds/call-ended.mp3') },
	{ _id: 'dialtone', name: 'Dialtone', extension: 'mp3', src: getAssetUrl('sounds/dialtone.mp3') },
	{ _id: 'ringtone', name: 'Ringtone', extension: 'mp3', src: getAssetUrl('sounds/ringtone.mp3') },
];

export const formatVolume = (volume: number) => {
	return Number((volume / 100).toPrecision(2));
};
