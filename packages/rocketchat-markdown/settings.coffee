Meteor.startup ->
  RocketChat.settings.add 'Markdown_Headers', false, {type: 'boolean', group: 'Message', section: 'Markdown', i18nLabel: 'Markdown_Headers'}
  RocketChat.settings.add 'Markdown_Schemes', 'http,https', {type: 'string', group: 'Message', section: 'Markdown', i18nLabel: 'Markdown_Support_Schemes_For_Link'}
