import { Meteor } from 'meteor/meteor';
import { settings } from '../../../../settings';
import EventEmitter from 'wolfy87-eventemitter';

class AudioEncoder extends EventEmitter {
	constructor(source, {
		bufferLen = 4096,
		numChannels = 1,
		bitRate = settings.get('Message_Audio_bitRate') || 32,
	} = {}) {
		super();

		const workerPath = Meteor.absoluteUrl('public/mp3-realtime-worker.js');

		this.worker = new Worker(workerPath);
		this.worker.onmessage = this.handleWorkerMessage;

		this.worker.postMessage({
			command: 'init',
			config: {
				sampleRate: source.context.sampleRate,
				numChannels,
				bitRate,
			},
		});

		this.scriptNode = (source.context.createScriptProcessor || source.context.createJavaScriptNode)
			.call(source.context, bufferLen, numChannels, numChannels);
		this.scriptNode.onaudioprocess = this.handleAudioProcess;

		source.connect(this.scriptNode);
		this.scriptNode.connect(source.context.destination);
	}

	close() {
		this.worker.postMessage({ command: 'finish' });
	}

	handleWorkerMessage = (event) => {
		switch (event.data.command) {
			case 'end': {
				const blob = new Blob(event.data.buffer, { type: 'audio/mp3' });
				this.emit('encoded', blob);
				this.worker.terminate();
				break;
			}
		}
	}

	handleAudioProcess = (event) => {
		for (let channel = 0; channel < event.inputBuffer.numberOfChannels; channel++) {
			const buffer = event.inputBuffer.getChannelData(channel);
			this.worker.postMessage({
				command: 'encode',
				buffer,
			});
		}
	}
}

export { AudioEncoder };
