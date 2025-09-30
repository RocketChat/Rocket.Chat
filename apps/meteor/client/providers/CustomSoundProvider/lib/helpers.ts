import type { ICustomSound } from '@rocket.chat/core-typings';

import { getURL } from '../../../../app/utils/client';

export const getAssetUrl = (asset: string, params?: Record<string, any>) => getURL(asset, params, undefined, true);

export const getCustomSoundURL = (sound: ICustomSound) => {
	return getAssetUrl(`/custom-sounds/${sound._id}.${sound.extension}`, { _dc: sound.random || 0 });
};

// Translation keys for sound names
export const soundTranslationKeys: Record<string, string> = {
	'chime': 'Sound_Chime',
	'door': 'Sound_Door',
	'beep': 'Sound_Beep',
	'chelle': 'Sound_Chelle',
	'ding': 'Sound_Ding',
	'droplet': 'Sound_Droplet',
	'highbell': 'Sound_Highbell',
	'seasons': 'Sound_Seasons',
	'telephone': 'Sound_Telephone',
	'outbound-call-ringing': 'Sound_Outbound_Call_Ringing',
	'call-ended': 'Sound_Call_Ended',
	'dialtone': 'Sound_Dialtone',
	'ringtone': 'Sound_Ringtone',
};

export const defaultSounds: ICustomSound[] = [
	{ _id: 'chime', name: 'Sound_Chime', extension: 'mp3', src: getAssetUrl('sounds/chime.mp3') },
	{ _id: 'door', name: 'Sound_Door', extension: 'mp3', src: getAssetUrl('sounds/door.mp3') },
	{ _id: 'beep', name: 'Sound_Beep', extension: 'mp3', src: getAssetUrl('sounds/beep.mp3') },
	{ _id: 'chelle', name: 'Sound_Chelle', extension: 'mp3', src: getAssetUrl('sounds/chelle.mp3') },
	{ _id: 'ding', name: 'Sound_Ding', extension: 'mp3', src: getAssetUrl('sounds/ding.mp3') },
	{ _id: 'droplet', name: 'Sound_Droplet', extension: 'mp3', src: getAssetUrl('sounds/droplet.mp3') },
	{ _id: 'highbell', name: 'Sound_Highbell', extension: 'mp3', src: getAssetUrl('sounds/highbell.mp3') },
	{ _id: 'seasons', name: 'Sound_Seasons', extension: 'mp3', src: getAssetUrl('sounds/seasons.mp3') },
	{ _id: 'telephone', name: 'Sound_Telephone', extension: 'mp3', src: getAssetUrl('sounds/telephone.mp3') },
	{
		_id: 'outbound-call-ringing',
		name: 'Sound_Outbound_Call_Ringing',
		extension: 'mp3',
		src: getAssetUrl('sounds/outbound-call-ringing.mp3'),
	},
	{ _id: 'call-ended', name: 'Sound_Call_Ended', extension: 'mp3', src: getAssetUrl('sounds/call-ended.mp3') },
	{ _id: 'dialtone', name: 'Sound_Dialtone', extension: 'mp3', src: getAssetUrl('sounds/dialtone.mp3') },
	{ _id: 'ringtone', name: 'Sound_Ringtone', extension: 'mp3', src: getAssetUrl('sounds/ringtone.mp3') },
];
