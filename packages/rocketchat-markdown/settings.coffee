Meteor.startup ->
  RocketChat.settings.add 'Markdown_Headers', false, {type: 'boolean', group: 'Message', section: 'Markdown', i18nLabel: 'Markdown_Headers'}
