import { useCallback, useEffect, useRef } from 'react';

class TonePlayer {
	private audioContext: AudioContext;

	// private audioElement: HTMLAudioElement;

	private gainNode: GainNode;

	private filter: BiquadFilterNode;

	private destination: MediaStreamAudioDestinationNode;

	// private elementSource: MediaElementAudioSourceNode;

	constructor(/* sinkId?: string */) {
		this.audioContext = new AudioContext();
		// this.audioElement = new Audio();
		// if (sinkId) {
		// 	console.log(sinkId);
		// 	this.audioElement.setSinkId(sinkId);
		// }

		this.destination = this.audioContext.createMediaStreamDestination();
		// this.audioContext.destination.connect(this.destination);
		// this.audioElement.srcObject = this.destination.stream;

		this.gainNode = this.audioContext.createGain();
		this.filter = this.audioContext.createBiquadFilter();
		this.filter.type = 'lowpass';
		this.filter.frequency.value = 8000;
		this.gainNode.gain.value = 0.5;
		this.gainNode.connect(this.filter);
		this.filter.connect(this.destination);
	}

	public getStream() {
		return this.destination.stream;
	}

	public static setupOscillator(audioCtx: AudioContext, filter: AudioNode) {
		const oscillator = audioCtx.createOscillator();
		oscillator.type = 'sine';
		oscillator.connect(filter);
		return oscillator;
	}

	public play(highFreq: number, lowFreq: number, durationMs?: number) {
		const highFrequencyOscillator = TonePlayer.setupOscillator(this.audioContext, this.gainNode);
		const lowFrequencyOscillator = TonePlayer.setupOscillator(this.audioContext, this.gainNode);

		lowFrequencyOscillator.frequency.value = lowFreq;
		highFrequencyOscillator.frequency.value = highFreq;

		lowFrequencyOscillator.start();
		highFrequencyOscillator.start();

		setTimeout(() => {
			lowFrequencyOscillator.stop();
			highFrequencyOscillator.stop();
			highFrequencyOscillator.disconnect();
			lowFrequencyOscillator.disconnect();
		}, durationMs ?? 400);
	}

	// public playAudioElement() {
	// 	console.log('playing audio element');
	// 	if (!this.audioElement.paused) {
	// 		return;
	// 	}
	// 	this.audioElement.play();
	// }

	public destroy() {
		this.audioContext.close();
		// this.audioElement.pause();
		// this.audioElement.srcObject = null;
	}
}

const DIGIT_TONE_MAP = {
	'1': [1209, 697],
	'2': [1336, 697],
	'3': [1477, 697],
	'4': [1209, 770],
	'5': [1336, 770],
	'6': [1477, 770],
	'7': [1209, 852],
	'8': [1336, 852],
	'9': [1477, 852],
	'*': [1209, 941],
	'0': [1336, 941],
	'#': [1477, 941],
} as const;

export const isValidTone = (tone: string): tone is keyof typeof DIGIT_TONE_MAP => {
	return Object.keys(DIGIT_TONE_MAP).includes(tone);
};

export const useTonePlayer = (sinkId?: string) => {
	const tonePlayer = useRef<TonePlayer | null>(null);

	useEffect(() => {
		tonePlayer.current = new TonePlayer();
		return () => tonePlayer.current?.destroy();
	}, [sinkId]);

	// useEffect(() => {
	// 	if (tonePlayer.current instanceof TonePlayer && sinkId) {
	// 		void tonePlayer.current.setSinkId(sinkId);
	// 	}
	// }, [sinkId]);
	const playTone = useCallback(
		(digit: keyof typeof DIGIT_TONE_MAP) => {
			if (!tonePlayer.current) {
				return;
			}
			// tonePlayer.current.playAudioElement();
			tonePlayer.current.play(DIGIT_TONE_MAP[digit][0], DIGIT_TONE_MAP[digit][1], 250);
		},
		[tonePlayer],
	);

	const stream = tonePlayer.current?.getStream();

	const toneRefCallback = useCallback(
		(node: HTMLAudioElement) => {
			if (!node || !stream) {
				return;
			}

			if (sinkId) {
				node.setSinkId(sinkId);
			}
			node.srcObject = stream;
			node.play();
		},
		[stream, sinkId],
	);

	return [playTone, toneRefCallback] as const;
};
