import { useCallback, useEffect, useRef } from 'react';

import { DIGIT_TONE_MAP, TonePlayer } from './useTonePlayer';

class TonePlayerRecorder extends TonePlayer {
	private mediaRecorder: MediaRecorder | null = null;

	private recordingChunks: Blob[] = [];

	public startRecording() {
		if (this.mediaRecorder) {
			return;
		}

		this.recordingChunks = [];
		this.mediaRecorder = new MediaRecorder(this.destination.stream);

		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				this.recordingChunks.push(event.data);
			}
		};

		this.mediaRecorder.start();
	}

	public stopRecording(): Promise<Blob> {
		return new Promise((resolve, reject) => {
			if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
				reject(new Error('No active recording'));
				return;
			}

			this.mediaRecorder.onstop = () => {
				const mimeType = this.mediaRecorder?.mimeType ?? 'audio/webm';
				const blob = new Blob(this.recordingChunks, { type: mimeType });
				this.recordingChunks = [];
				this.mediaRecorder = null;
				resolve(blob);
			};

			this.mediaRecorder.stop();
		});
	}

	public async recordTone(highFreq: number, lowFreq: number, durationMs = 400): Promise<Blob> {
		if (this.mediaRecorder) {
			throw new Error('A recording is already in progress');
		}

		this.startRecording();
		this.play(highFreq, lowFreq, durationMs);

		// Wait for the tone to finish plus a small buffer so the encoder flushes
		await new Promise<void>((resolve) => setTimeout(resolve, durationMs + 100));

		return this.stopRecording();
	}

	public override destroy() {
		if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
			this.mediaRecorder.stop();
			this.mediaRecorder = null;
			this.recordingChunks = [];
		}
		super.destroy();
	}
}

export const useTonePlayerRecorder = (sinkId?: string) => {
	const tonePlayer = useRef<TonePlayerRecorder | null>(null);

	useEffect(() => {
		tonePlayer.current = new TonePlayerRecorder();
		return () => tonePlayer.current?.destroy();
	}, []);

	useEffect(() => {
		if (tonePlayer.current && sinkId) {
			void tonePlayer.current.setSinkId(sinkId);
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

	const startRecording = useCallback(() => {
		tonePlayer.current?.startRecording();
	}, []);

	const stopRecording = useCallback((): Promise<Blob> => {
		if (!tonePlayer.current) {
			return Promise.reject(new Error('TonePlayer not initialized'));
		}
		return tonePlayer.current.stopRecording();
	}, []);

	const recordAndDownloadTone = useCallback(async (digit: keyof typeof DIGIT_TONE_MAP): Promise<void> => {
		if (!tonePlayer.current) {
			throw new Error('TonePlayer not initialized');
		}

		const [high, low] = DIGIT_TONE_MAP[digit];
		const blob = await tonePlayer.current.recordTone(high, low, 250);

		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `tone-${digit}.webm`;
		anchor.click();
		URL.revokeObjectURL(url);
	}, []);

	return { playTone, startRecording, stopRecording, recordAndDownloadTone };
};
