import { useCallback, useEffect, useRef } from 'react';

class TonePlayer {
	private audioContext: AudioContext;

	private audioElement: HTMLAudioElement;

	private gainNode: GainNode;

	private filter: BiquadFilterNode;

	private destination: MediaStreamAudioDestinationNode;

	constructor() {
		this.audioContext = new AudioContext();
		this.audioElement = new Audio();

		// Route audio through an audio element
		// In order to be able to set the sink id
		this.destination = this.audioContext.createMediaStreamDestination();
		this.audioElement.srcObject = this.destination.stream;

		// Audio volume control
		this.gainNode = this.audioContext.createGain();
		this.gainNode.gain.value = 0.5;

		// This filter makes the sound more natural
		this.filter = this.audioContext.createBiquadFilter();
		this.filter.type = 'bandpass';
		this.filter.frequency.value = 4000;

		this.gainNode.connect(this.filter);
		this.filter.connect(this.destination);
	}

	public async setSinkId(sinkId: string) {
		if (this.audioElement.setSinkId) {
			return this.audioElement.setSinkId(sinkId);
		}
		console.warn('setSinkId not supported on this browser');
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

		const startTime = this.audioContext.currentTime;

		lowFrequencyOscillator.start(startTime);
		highFrequencyOscillator.start(startTime);

		// Ensure audio element is playing
		if (this.audioElement.paused) {
			this.audioElement.play().catch((error) => {
				console.warn('Failed to play audio element:', error);
			});
		}

		highFrequencyOscillator.stop(startTime + (durationMs ?? 400) / 1000);
		lowFrequencyOscillator.stop(startTime + (durationMs ?? 400) / 1000);
	}

	public destroy() {
		this.audioContext.close();
		this.audioElement.pause();
		this.audioElement.srcObject = null;
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
	}, []);

	useEffect(() => {
		if (tonePlayer.current && sinkId) {
			tonePlayer.current.setSinkId(sinkId);
		}
	}, [sinkId]);

	const playTone = useCallback(
		(digit: keyof typeof DIGIT_TONE_MAP) => {
			if (!tonePlayer.current) {
				return;
			}
			tonePlayer.current.play(DIGIT_TONE_MAP[digit][0], DIGIT_TONE_MAP[digit][1], 250);
		},
		[tonePlayer],
	);

	return playTone;
};
