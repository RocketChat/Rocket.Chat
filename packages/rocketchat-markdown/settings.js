import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(() => {
	RocketChat.settings.add('Markdown_Parser', 'original', {
		type: 'select',
		values: [{
			key: 'disabled',
			i18nLabel: 'Disabled'
		}, {
			key: 'original',
			i18nLabel: 'Original'
		}, {
			key: 'marked',
			i18nLabel: 'Marked'
		}],
		group: 'Message',
		section: 'Markdown',
		public: true
	});

	const enableQueryOriginal = {_id: 'Markdown_Parser', value: 'original'};
	RocketChat.settings.add('Markdown_Headers', false, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: enableQueryOriginal
	});
	RocketChat.settings.add('Markdown_SupportSchemesForLink', 'http,https', {
		type: 'string',
		group: 'Message',
		section: 'Markdown',
		public: true,
		i18nDescription: 'Markdown_SupportSchemesForLink_Description',
		enableQuery: enableQueryOriginal
	});

	const enableQueryMarked = {_id: 'Markdown_Parser', value: 'marked'};
	RocketChat.settings.add('Markdown_Marked_GFM', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: enableQueryMarked
	});
	RocketChat.settings.add('Markdown_Marked_Tables', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: enableQueryMarked
	});
	RocketChat.settings.add('Markdown_Marked_Breaks', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: enableQueryMarked
	});
	RocketChat.settings.add('Markdown_Marked_Pedantic', false, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: [{
			_id: 'Markdown_Parser',
			value: 'marked'
		}, {
			_id: 'Markdown_Marked_GFM',
			value: false
		}]
	});
	RocketChat.settings.add('Markdown_Marked_SmartLists', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: enableQueryMarked
	});
	RocketChat.settings.add('Markdown_Marked_Smartypants', true, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true,
		enableQuery: enableQueryMarked
	});
});
