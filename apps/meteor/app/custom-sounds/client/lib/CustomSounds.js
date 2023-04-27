import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { CachedCollectionManager } from '../../../ui-cached-collection/client';
import { getURL } from '../../../utils/client';

const getCustomSoundId = (sound) => `custom-sound-${sound}`;

class CustomSoundsClass {
	constructor() {
		this.list = new ReactiveVar({});
		this.add({ _id: 'chime', name: 'Chime', extension: 'mp3', src: getURL('sounds/chime.mp3') });
		this.add({ _id: 'door', name: 'Door', extension: 'mp3', src: getURL('sounds/door.mp3') });
		this.add({ _id: 'beep', name: 'Beep', extension: 'mp3', src: getURL('sounds/beep.mp3') });
		this.add({ _id: 'chelle', name: 'Chelle', extension: 'mp3', src: getURL('sounds/chelle.mp3') });
		this.add({ _id: 'ding', name: 'Ding', extension: 'mp3', src: getURL('sounds/ding.mp3') });
		this.add({
			_id: 'droplet',
			name: 'Droplet',
			extension: 'mp3',
			src: getURL('sounds/droplet.mp3'),
		});
		this.add({
			_id: 'highbell',
			name: 'Highbell',
			extension: 'mp3',
			src: getURL('sounds/highbell.mp3'),
		});
		this.add({
			_id: 'seasons',
			name: 'Seasons',
			extension: 'mp3',
			src: getURL('sounds/seasons.mp3'),
		});
		this.add({
			_id: 'telephone',
			name: 'Telephone',
			extension: 'mp3',
			src: getURL('sounds/telephone.mp3'),
		});
		this.add({
			_id: 'outbound-call-ringing',
			name: 'Outbound Call Ringing',
			extension: 'mp3',
			src: getURL('sounds/outbound-call-ringing.mp3'),
		});
		this.add({
			_id: 'call-ended',
			name: 'Call Ended',
			extension: 'mp3',
			src: getURL('sounds/call-ended.mp3'),
		});
		this.add({ _id: 'dialtone', name: 'Dialtone', extension: 'mp3', src: getURL('sounds/dialtone.mp3') });
		this.add({ _id: 'ringtone', name: 'Ringtone', extension: 'mp3', src: getURL('sounds/ringtone.mp3') });
	}

	add(sound) {
		if (!sound.src) {
			sound.src = this.getURL(sound);
		}

		const source = document.createElement('source');
		source.src = sound.src;

		const audio = document.createElement('audio');
		audio.id = getCustomSoundId(sound);
		audio.preload = 'auto';
		audio.appendChild(source);

		document.body.appendChild(audio);

		const list = this.list.get();
		list[sound._id] = sound;
		this.list.set(list);
	}

	remove(sound) {
		const list = this.list.get();
		delete list[sound._id];
		this.list.set(list);
		const audio = document.getElementById(sound._id);
		audio?.remove();
	}

	update(sound) {
		const audio = document.getElementById(sound._id);
		if (audio) {
			const list = this.list.get();
			if (!sound.src) {
				sound.src = this.getURL(sound);
			}
			list[sound._id] = sound;
			this.list.set(list);
			audio.querySelector('source').src = sound.src;
			audio.load();
		} else {
			this.add(sound);
		}
	}

	getURL(sound) {
		return getURL(`/custom-sounds/${sound._id}.${sound.extension}?_dc=${sound.random || 0}`);
	}

	getList() {
		const list = Object.values(this.list.get());
		return list.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
	}

	play = (sound, { volume = 1, loop = false } = {}) => {
		const audio = document.querySelector(`#${getCustomSoundId(sound)}`);
		if (!audio || !audio.play) {
			return;
		}

		audio.volume = volume;
		audio.loop = loop;
		audio.play();

		return audio;
	};

	pause = (sound) => {
		const audio = document.querySelector(`#${getCustomSoundId(sound)}`);
		if (!audio || !audio.pause) {
			return;
		}

		audio.pause();
	};

	isPlaying = (sound) => {
		const audio = document.querySelector(`#${getCustomSoundId(sound)}`);

		return audio && audio.duration > 0 && !audio.paused;
	};
}

export const CustomSounds = new CustomSoundsClass();

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() => {
		Meteor.call('listCustomSounds', (error, result) => {
			for (const sound of result) {
				CustomSounds.add(sound);
			}
		});
	}),
);
