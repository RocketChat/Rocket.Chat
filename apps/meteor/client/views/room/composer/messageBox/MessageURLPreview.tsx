import React from 'react';
import type { ReactElement } from 'react';

export type URLMeta = {
	ogImage?: string;
	ogImageHeight?: string;
	ogImageWidth?: string;
	ogTitle?: string;
	ogType?: string;
	pageTitle?: string;
};

const MessageURLPreview = ({ meta }: { meta: URLMeta }): ReactElement => {
	// TODO: Use meta to render a preview of the URL
	console.log(meta);
	// TODO: Style this component
	return <h1>hello world</h1>;
};

export default MessageURLPreview;
