import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const cache = new Map<string, ReactiveVar<string>>();

Template.registerHelper('RocketChatMarkdown', (text: string) => {
	if (!cache.has(text)) {
		const html = new ReactiveVar('');
		cache.set(text, html);

		import('../../app/markdown/client').then(({ Markdown }) => {
			html.set(Markdown.parse(text));
			setTimeout(() => {
				cache.delete(text);
			}, 3000);
		});
	}

	return cache.get(text)?.get();
});
