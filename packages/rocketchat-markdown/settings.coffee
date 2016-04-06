Meteor.startup ->
  RocketChat.settings.add 'Markdown_Headers', false, {type: 'boolean', group: 'Message', section: 'Markdown', public: true}
