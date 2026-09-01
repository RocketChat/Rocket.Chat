import { useCallback, useEffect, useRef } from 'react';

/**
 * Plays a MediaStream in a media element, and — importantly — leaves it playing.
 *
 * The obvious way to write this is a ref callback that depends on the stream, assigning `srcObject` on the way in and
 * clearing it on the way out. React re-runs a ref callback whenever its identity changes, so that version detached
 * and re-attached the stream every time the *object* changed, whether or not the stream had. The visible result was a
 * camera that blinked whenever something unrelated happened — muting a microphone, switching microphone device —
 * because those rebuild the object the camera stream is handed over in.
 *
 * So the element is captured by a callback that never changes identity, and attaching is done by an effect that
 * compares first: the same stream arriving in a new wrapper costs nothing, and only a genuinely different stream is
 * swapped in. The source is cleared when the element goes away or the stream does, and not otherwise.
 */
export const usePlayMediaStream = (
	stream?: MediaStream | null,
): [(node: HTMLAudioElement | null) => void, { current: HTMLAudioElement | null }] => {
	const actualRef = useRef<HTMLAudioElement | null>(null);

	// Read by the ref callback, which cannot depend on the stream without getting a new identity for each one.
	// Seeded on mount and kept in step after every commit, rather than written while rendering: a render that is
	// thrown away must not leave its stream behind for an element that attaches later.
	const streamRef = useRef(stream);

	useEffect(() => {
		streamRef.current = stream;
	});

	const play = useCallback((node: HTMLAudioElement, next: MediaStream) => {
		if (node.srcObject === next) {
			return;
		}

		node.srcObject = next;
		void node.play().catch((error) => {
			console.warn('MediaCall: usePlayMediaStream - Stream stopped playing', error);
		});
	}, []);

	const setNode = useCallback(
		(node: HTMLAudioElement | null) => {
			if (!node) {
				const previous = actualRef.current;
				actualRef.current = null;
				if (previous) {
					previous.pause();
					previous.srcObject = null;
				}
				return;
			}

			actualRef.current = node;
			const { current } = streamRef;
			if (current) {
				play(node, current);
			}
		},
		[play],
	);

	useEffect(() => {
		const node = actualRef.current;
		if (!node) {
			return;
		}

		if (stream) {
			play(node, stream);
			return;
		}

		// Nothing to play: let go of whatever was there, so a stopped camera does not leave its last frame frozen.
		node.pause();
		node.srcObject = null;
	}, [stream, play]);

	return [setNode, actualRef];
};
