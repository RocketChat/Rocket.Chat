import PageLoading from '../root/PageLoading';

type ConferenceIframeProps = {
	url: string | undefined;
	loading?: boolean;
};

const ConferenceIframe = ({ url, loading }: ConferenceIframeProps) => {
	if (loading) {
		return <PageLoading />;
	}

	return (
		<iframe
			style={{ width: '100%', height: '100%', flexGrow: 1 }}
			title='external-frame'
			src={url}
			allow='camera; microphone; display-capture; fullscreen; autoplay; speaker-selection; clipboard-write; clipboard-read; compute-pressure'
			allowFullScreen
			referrerPolicy='strict-origin-when-cross-origin'
		/>
	);
};

export default ConferenceIframe;
