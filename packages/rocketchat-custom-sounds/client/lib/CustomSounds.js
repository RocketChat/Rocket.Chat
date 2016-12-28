/* globals isSetNotNull */
class CustomSounds {
	constructor() {
		this.list = new ReactiveVar({});
	}

	add(sound) {
		sound.src = this.getURL(sound);
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
		delete this.list[sound._id];
		this.list.set(list);
		$('#' + sound._id).remove();
	}

	update(sound) {
		const audio = $(`#${sound._id}`);
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
		let path = (Meteor.isCordova) ? Meteor.absoluteUrl().replace(/\/$/, '') : __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
		return `${path}/custom-sounds/${sound._id}.${sound.extension}?_dc=${sound.random || 0}`;
	}

	getList() {
		return Object.values(this.list.get());
	}
}

RocketChat.CustomSounds = new CustomSounds;

Meteor.startup(() =>
	Meteor.call('listCustomSounds', (error, result) => {
		for (let sound of result) {
			RocketChat.CustomSounds.add(sound);
		}
	})
);
