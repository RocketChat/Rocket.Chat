import { Box } from '../Box';

const VideoPlayerSeekTrack = ({ buffered, progress }: { buffered: number; progress: number }) => (
	<>
		<Box position='absolute' inset={0} borderRadius='full' backgroundColor='badge-background-level-1' opacity={0.5} />
		<Box
			position='absolute'
			insetBlock={0}
			insetInlineStart={0}
			width={`${buffered}%`}
			borderRadius='full'
			backgroundColor='badge-background-level-1'
		/>
		<Box
			position='absolute'
			insetBlock={0}
			insetInlineStart={0}
			width={`${progress}%`}
			borderRadius='full'
			backgroundColor='badge-background-level-2'
		/>
	</>
);

export default VideoPlayerSeekTrack;
