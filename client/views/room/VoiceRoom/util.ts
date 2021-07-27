// import EventEmitter from 'events';
import { Emitter } from '@rocket.chat/emitter';

const getMaxVolume = (analyser: AnalyserNode, data: Float32Array): number => {
	let maxVolume = -Infinity;
	analyser.getFloatFrequencyData(data);
	for (let i = 4; i < data.length; i++) {
		if (data[i] > maxVolume && data[i] < 0) {
			maxVolume = data[i];
		}
	}

	return maxVolume;
};

export const analyseAudio = (source: MediaStream): Emitter => {
	const audioContext = new AudioContext();
	const audioSource = audioContext.createMediaStreamSource(source);
	const analyser = audioContext.createAnalyser();

	let speaking = false;
	const interval = 50;
	const threshold = -50;

	analyser.fftSize = 512;
	analyser.smoothingTimeConstant = 0.1;

	audioSource.connect(analyser);

	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Float32Array(bufferLength);

	const emitter = new Emitter();

	const loop = (): void => {
		setTimeout(() => {
			const currentVolume = getMaxVolume(analyser, dataArray);

			if (currentVolume > threshold && !speaking) {
				speaking = true;
				emitter.emit('speaking');
			} else if (currentVolume < threshold && speaking) {
				speaking = false;
				emitter.emit('stopped_speaking');
			}

			loop();
		}, interval);
	};

	loop();

	return emitter;
};
