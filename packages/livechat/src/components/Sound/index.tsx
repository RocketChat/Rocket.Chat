import { Component } from 'preact';

type SoundProps = {
	src?: string;
	play?: boolean;
	onStart?: () => void;
	onStop?: () => void;
	dismissNotification?: () => unknown;
};

export class Sound extends Component<SoundProps> {
	audio: HTMLAudioElement | null = null;

	play = () => {
		void this.audio?.play();
	};

	handleRef = (audio: HTMLAudioElement | null) => {
		this.audio = audio;
	};

	handlePlayProp = () => {
		const { play, dismissNotification } = this.props;

		if (play) {
			if (dismissNotification && dismissNotification()) {
				return;
			}
			void this.audio?.play();
		} else if (this.audio && !this.audio.ended && !this.audio.paused) {
			this.audio.pause();
			this.audio.currentTime = 0;
		}
	};

	override componentDidMount() {
		this.handlePlayProp();
	}

	override componentDidUpdate() {
		this.handlePlayProp();
	}

	// eslint-disable-next-line jsx-a11y/media-has-caption
	render = ({ src, onStart, onStop }: SoundProps) => <audio ref={this.handleRef} src={src} onPlay={onStart} onEnded={onStop} />;
}
