import type { ICustomSound } from '@rocket.chat/core-typings';
import { ReactiveVar } from 'meteor/reactive-var';

import { getURL } from '../../../utils/client';
import { sdk } from '../../../utils/client/lib/SDKClient';

const getCustomSoundId = (soundId: ICustomSound['_id']) => `custom-sound-${soundId}`;
const getAssetUrl = (asset: string, params?: Record<string, any>) => getURL(asset, params, undefined, true);

const defaultSounds = [
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

class CustomSoundsClass {
	list: ReactiveVar<Record<string, ICustomSound>>;

	initialFetchDone: boolean;

	constructor() {
		this.list = new ReactiveVar({});
		this.initialFetchDone = false;
		defaultSounds.forEach((sound) => this.add(sound));
	}

	add(sound: ICustomSound) {
		if (!sound.src) {
			sound.src = this.getURL(sound);
		}

		const source = document.createElement('source');
		source.src = sound.src;

		const audio = document.createElement('audio');
		audio.id = getCustomSoundId(sound._id);
		audio.preload = 'none';
		audio.appendChild(source);

		document.body.appendChild(audio);

		const list = this.list.get();
		list[sound._id] = sound;
		this.list.set(list);
	}

	remove(sound: ICustomSound) {
		const list = this.list.get();
		delete list[sound._id];
		this.list.set(list);
		const audio = document.querySelector<HTMLAudioElement>(`#${getCustomSoundId(sound._id)}`);
		audio?.remove();
	}

	getSound(soundId: ICustomSound['_id']) {
		const list = this.list.get();
		return list[soundId];
	}

	update(sound: ICustomSound) {
		const audio = document.querySelector<HTMLAudioElement>(`#${getCustomSoundId(sound._id)}`);
		if (audio) {
			const list = this.list.get();
			if (!sound.src) {
				sound.src = this.getURL(sound);
			}
			list[sound._id] = sound;
			this.list.set(list);
			const sourceEl = audio.querySelector('source');
			if (sourceEl) {
				sourceEl.src = sound.src;
			}
			audio.load();
		} else {
			this.add(sound);
		}
	}

	getURL(sound: ICustomSound) {
		return getAssetUrl(`/custom-sounds/${sound._id}.${sound.extension}`, { _dc: sound.random || 0 });
	}

	getList() {
		const list = Object.values(this.list.get());
		return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
	}

	play = async (soundId: ICustomSound['_id'], { volume = 1, loop = false } = {}) => {
		const audio = document.querySelector<HTMLAudioElement>(`#${getCustomSoundId(soundId)}`);
		if (!audio?.play) {
			return;
		}

		audio.volume = volume;
		audio.loop = loop;
		await audio.play();

		return audio;
	};

	pause = (soundId: ICustomSound['_id']) => {
		const audio = document.querySelector<HTMLAudioElement>(`#${getCustomSoundId(soundId)}`);
		if (!audio?.pause) {
			return;
		}

		audio.pause();
	};

	stop = (soundId: ICustomSound['_id']) => {
		const audio = document.querySelector<HTMLAudioElement>(`#${getCustomSoundId(soundId)}`);
		if (!audio?.load) {
			return;
		}

		audio?.load();
	};

	isPlaying = (soundId: ICustomSound['_id']) => {
		const audio = document.querySelector<HTMLAudioElement>(`#${getCustomSoundId(soundId)}`);

		return audio && audio.duration > 0 && !audio.paused;
	};

	fetchCustomSoundList = async () => {
		if (this.initialFetchDone) {
			return;
		}
		const result = await sdk.call('listCustomSounds');
		for (const sound of result) {
			this.add(sound);
		}
		this.initialFetchDone = true;
	};
}

export const CustomSounds = new CustomSoundsClass();
