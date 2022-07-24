import { Meteor } from 'meteor/meteor';
import { Emitter } from '@rocket.chat/emitter';

import { settings } from '../../../../settings';

class AudioEncoder extends Emitter {
	constructor(source, { bufferLen = 4096, numChannels = 1, bitRate = settings.get('Message_Audio_bitRate') || 32 } = {}) {
		super();

		const workerPath = Meteor.absoluteUrl('workers/mp3-encoder/index.js');

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

		this.scriptNode = (source.context.createScriptProcessor || source.context.createJavaScriptNode).call(
			source.context,
			bufferLen,
			numChannels,
			numChannels,
		);
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
				const blob = new Blob(event.data.buffer, { type: 'audio/mpeg' });
				this.emit('encoded', blob);
				this.worker.terminate();
				break;
			}
		}
	};

	handleAudioProcess = (event) => {
		for (let channel = 0; channel < event.inputBuffer.numberOfChannels; channel++) {
			const buffer = event.inputBuffer.getChannelData(channel);
			this.worker.postMessage({
				command: 'encode',
				buffer,
			});
		}
	};
}

export { AudioEncoder };
