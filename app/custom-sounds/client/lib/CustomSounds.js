import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import _ from 'underscore';

import { CachedCollectionManager } from '../../../ui-cached-collection';

class CustomSoundsClass {
	constructor() {
		this.list = new ReactiveVar({});
		this.add({ _id: 'beep', name: 'Beep', extension: 'mp3', src: 'sounds/beep.mp3' });
		this.add({ _id: 'chelle', name: 'Chelle', extension: 'mp3', src: 'sounds/chelle.mp3' });
		this.add({ _id: 'ding', name: 'Ding', extension: 'mp3', src: 'sounds/ding.mp3' });
		this.add({ _id: 'droplet', name: 'Droplet', extension: 'mp3', src: 'sounds/droplet.mp3' });
		this.add({ _id: 'highbell', name: 'Highbell', extension: 'mp3', src: 'sounds/highbell.mp3' });
		this.add({ _id: 'seasons', name: 'Seasons', extension: 'mp3', src: 'sounds/seasons.mp3' });
	}

	add(sound) {
		if (!sound.src) {
			sound.src = this.getURL(sound);
		}
		const audio = $('<audio />', { id: sound._id, preload: true }).append(
			$('<source />', { src: sound.src })
		);
		const list = this.list.get();
		list[sound._id] = sound;
		this.list.set(list);
		$('body').append(audio);
	}

	remove(sound) {
		const list = this.list.get();
		delete list[sound._id];
		this.list.set(list);
		$(`#${ sound._id }`).remove();
	}

	update(sound) {
		const audio = $(`#${ sound._id }`);
		if (audio && audio[0]) {
			const list = this.list.get();
			list[sound._id] = sound;
			this.list.set(list);
			$('source', audio).attr('src', this.getURL(sound));
			audio[0].load();
		} else {
			this.add(sound);
		}
	}

	getURL(sound) {
		const path = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		return `${ path }/custom-sounds/${ sound._id }.${ sound.extension }?_dc=${ sound.random || 0 }`;
	}

	getList() {
		const list = Object.values(this.list.get());
		return _.sortBy(list, 'name');
	}
}
export const CustomSounds = new CustomSoundsClass();

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() => {
		Meteor.call('listCustomSounds', (error, result) => {
			for (const sound of result) {
				CustomSounds.add(sound);
			}
		});
	})
);
