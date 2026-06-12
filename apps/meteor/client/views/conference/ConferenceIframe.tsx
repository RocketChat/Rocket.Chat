type ConferenceIframeProps = {
	url: string | undefined;
	loading: boolean;
};

const ConferenceIframe = ({ url, loading }: ConferenceIframeProps) => {
	if (!url) {
		return <div>No conference URL provided.</div>;
	}

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<iframe
			style={{ width: '100%', height: '100%' }}
			title='external-frame'
			src={url}
			allow='camera; microphone; display-capture; fullscreen; autoplay; speaker-selection; clipboard-write; clipboard-read; compute-pressure'
			allowFullScreen
			referrerPolicy='strict-origin-when-cross-origin'
		/>
	);
};

export default ConferenceIframe;
