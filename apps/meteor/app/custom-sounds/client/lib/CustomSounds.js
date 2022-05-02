import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';

import { CachedCollectionManager } from '../../../ui-cached-collection';
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
	}

	add(sound) {
		if (!sound.src) {
			sound.src = this.getURL(sound);
		}
		const audio = $('<audio />', { id: getCustomSoundId(sound._id), preload: true }).append($('<source />', { src: sound.src }));
		const list = this.list.get();
		list[sound._id] = sound;
		this.list.set(list);
		$('body').append(audio);
	}

	remove(sound) {
		const list = this.list.get();
		delete list[sound._id];
		this.list.set(list);
		$(`#${sound._id}`).remove();
	}

	update(sound) {
		const audio = $(`#${sound._id}`);
		if (audio && audio[0]) {
			const list = this.list.get();
			if (!sound.src) {
				sound.src = this.getURL(sound);
			}
			list[sound._id] = sound;
			this.list.set(list);
			$('source', audio).attr('src', sound.src);
			audio[0].load();
		} else {
			this.add(sound);
		}
	}

	getURL(sound) {
		return getURL(`/custom-sounds/${sound._id}.${sound.extension}?_dc=${sound.random || 0}`);
	}

	getList() {
		const list = Object.values(this.list.get());
		return _.sortBy(list, 'name');
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
		if (audio.currentTime !== 0) {
			audio.currentTime = 0;
		}
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
