/** A link to a page a task drew on, such as a document an AI agent read; typed only for the `sources` of a `task_card`. */
export type UrlSourceElement = {
	type: 'url';
	url: string;
	text: string;
};
