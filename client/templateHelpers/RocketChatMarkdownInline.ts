import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

const cache = new Map<string, ReactiveVar<string>>();

Template.registerHelper('RocketChatMarkdownInline', (text: string) => {
	if (!cache.has(text)) {
		const html = new ReactiveVar('');
		cache.set(text, html);

		import('../../app/markdown/client').then(({ Markdown }) => {
			html.set(Markdown.parse(text).replace(/^<p>|<\/p>$/, 'wat'));
			setTimeout(() => {
				cache.delete(text);
			}, 3000);
		});
	}

	return cache.get(text)?.get();
});
