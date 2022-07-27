import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { CachedCollectionManager } from '../../../ui-cached-collection';
import { getURL, t } from '../../../utils/client';
import { dispatchToastMessage } from '../../../../client/lib/toast';

const getCustomSoundId = <T extends string>(sound: T): `custom-sound-${T}` => `custom-sound-${sound}`;

type CustomSound = {
	_id: string;
	name: string;
	extension: string;
	src: string;
	random?: string;
};

class CustomSoundsClass {
	public list: Map<string, CustomSound> = new Map();

	constructor() {
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

	add(sound: CustomSound): void {
		if (!sound.src) {
			sound.src = this.getURL(sound);
		}
		const audio = $('<audio />', { id: getCustomSoundId(sound._id), preload: true }).append($('<source />', { src: sound.src }));
		this.list.set(sound._id, sound);
		$('body').append(audio);
	}

	remove(sound: string): void {
		this.list.delete(sound);
		$(`#${sound}`).remove();
	}

	update(sound: CustomSound): void {
		const audio = $(`#${sound._id}`).get(0) as HTMLAudioElement;
		if (!audio) {
			return this.add(sound);
		}
		if (!sound.src) {
			sound.src = this.getURL(sound);
		}
		this.list.set(sound._id, sound);
		$('source', audio).attr('src', sound.src);
		audio.load();
	}

	getURL(sound: CustomSound): string {
		return getURL(`/custom-sounds/${sound._id}.${sound.extension}?_dc=${sound.random || 0}`);
	}

	getList(): CustomSound[] {
		return _.sortBy([...this.list.values()], 'name');
	}

	play(sound: string, { volume = 1, loop = false }: { volume?: number; loop?: boolean } = {}): HTMLAudioElement | undefined {
		const audio = document.querySelector(`#${getCustomSoundId(sound)}`) as HTMLAudioElement;
		if (!audio || !audio.play) {
			return;
		}

		audio.volume = volume;
		audio.loop = loop;

		audio.play().catch(() =>
			dispatchToastMessage({
				type: 'error',
				message: t('Audio_Notification_Interaction_Error'),
				options: {
					closeButton: true,
					timeOut: 0,
					extendedTimeOut: 0,
				},
			}),
		);

		return audio;
	}

	pause(sound: string): void {
		const audio = document.querySelector(`#${getCustomSoundId(sound)}`) as HTMLAudioElement;
		if (!audio || !audio.pause) {
			return;
		}

		audio.pause();
		if (audio.currentTime !== 0) {
			audio.currentTime = 0;
		}
	}

	isPlaying(sound: string): boolean {
		const audio = document.querySelector(`#${getCustomSoundId(sound)}`) as HTMLAudioElement;

		return audio && audio.duration > 0 && !audio.paused;
	}
}

export const CustomSounds = new CustomSoundsClass();

Meteor.startup(() =>
	CachedCollectionManager.onLogin(() => {
		Meteor.call('listCustomSounds', (_: Error, result: CustomSound[]) => {
			for (const sound of result) {
				CustomSounds.add(sound);
			}
		});
	}),
);
