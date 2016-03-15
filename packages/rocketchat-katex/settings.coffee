Meteor.startup ->
  RocketChat.settings.add 'Katex_Enabled', false, {type: 'boolean', group: 'Message', section: 'Katex', public: true, i18nLabel: 'Katex_Enabled'}
