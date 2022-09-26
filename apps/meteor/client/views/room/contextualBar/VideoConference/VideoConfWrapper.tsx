import React, { ReactElement, useEffect } from 'react';

// TODO: props type

const VideoConfWrapper = (props: any): ReactElement => {
	console.log(props);

	useEffect(() => {
		const pexipScript = document.createElement('script');

		pexipScript.src = 'pathToScript';
		pexipScript.async = true;

		document.body.appendChild(pexipScript);
	}, []);

	return <iframe width='100%' height='100%' src={props.url} />;
};

export default VideoConfWrapper;
