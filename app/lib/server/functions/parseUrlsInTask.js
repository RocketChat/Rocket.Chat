import { Markdown } from '../../../markdown/server';

export const parseUrlsInTask = (task) => {
	if (task.parseUrls === false) {
		return task;
	}

	task.html = task.title;
	task = Markdown.code(task);

	const urls = task.html.match(/([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]*)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g) || [];
	if (urls) {
		task.urls = urls.map((url) => ({ url }));
	}

	task = Markdown.mountTokensBack(task, false);
	task.title = task.html;
	delete task.html;
	delete task.tokens;

	return task;
};
