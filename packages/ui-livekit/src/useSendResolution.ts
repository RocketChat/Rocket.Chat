import type { LocalVideoTrack } from 'livekit-client';
import { useEffect, useState } from 'react';

/** Often enough to notice a layer change, rarely enough that polling the encoder costs nothing. */
const INTERVAL_MS = 3000;

/**
 * The resolution actually going out, asked of the encoder rather than of the camera.
 *
 * These are different numbers and the difference matters: the camera may be capturing 1080p while the encoder sends a
 * 540p simulcast layer because of bandwidth, CPU, or how large the far side is displaying you. A badge built from the
 * capture settings would confidently show 1080p to someone whose picture is arriving at a quarter of that — which is
 * precisely the sort of claim this call UI has been getting wrong all along.
 *
 * `getStats()` on the sender is the only thing that knows. Outbound video stats carry `frameWidth`/`frameHeight` per
 * layer, so the highest of them is what is being sent; nothing is reported until the encoder has produced a frame,
 * which is why this can be undefined for the first second or two of a call.
 */
export const useSendResolution = (videoTrack: LocalVideoTrack | undefined): { width: number; height: number } | undefined => {
	const [resolution, setResolution] = useState<{ width: number; height: number } | undefined>();

	useEffect(() => {
		if (!videoTrack) {
			setResolution(undefined);
			return;
		}

		let cancelled = false;

		const read = async () => {
			try {
				const stats = await videoTrack.getRTCStatsReport();
				if (cancelled || !stats) {
					return;
				}

				let best: { width: number; height: number } | undefined;
				stats.forEach((report) => {
					if (report.type !== 'outbound-rtp') {
						return;
					}

					const { frameWidth: width, frameHeight: height } = report as RTCOutboundRtpStreamStats & {
						frameWidth?: number;
						frameHeight?: number;
					};

					// The tallest layer being sent is what the best-placed viewer receives.
					if (width && height && (!best || height > best.height)) {
						best = { width, height };
					}
				});

				setResolution((current) => (current?.width === best?.width && current?.height === best?.height ? current : best));
			} catch {
				// Stats are a courtesy; a badge is not worth an error.
			}
		};

		void read();
		const timer = setInterval(() => void read(), INTERVAL_MS);

		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, [videoTrack]);

	return resolution;
};
