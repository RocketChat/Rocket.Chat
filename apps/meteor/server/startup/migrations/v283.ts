import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 283,
	up() {
		const deprecatedSettings = [
			'Markdown_Parser',
			'Markdown_Headers',
			'Markdown_SupportSchemesForLink',
			'Markdown_Marked_GFM',
			'Markdown_Marked_Tables',
			'Markdown_Marked_Breaks',
			'Markdown_Marked_Pedantic',
			'Markdown_Marked_SmartLists',
			'Markdown_Marked_Smartypants',
			'Message_AllowSnippeting',
			'Message_Attachments_GroupAttach',
			'Message_ShowEditedStatus',
			'Message_ShowFormattingTips',
			'Accounts_Default_User_Preferences_useLegacyMessageTemplate',
			'AutoLinker',
			'AutoLinker_StripPrefix',
			'AutoLinker_Urls_Scheme',
			'AutoLinker_Urls_www',
			'AutoLinker_Urls_TLD',
			'AutoLinker_UrlsRegExp',
			'AutoLinker_Email',
			'AutoLinker_Phone',
			'IssueLinks_Enabled',
			'IssueLinks_Template',
			'API_EmbedDisabledFor',
		];

		Settings.deleteMany({
			_id: { $in: deprecatedSettings },
		});
	},
});
