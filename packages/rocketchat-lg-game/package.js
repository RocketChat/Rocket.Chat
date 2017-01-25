Package.describe({
  name: 'learnersguild:rocketchat-lg-game',
  version: '1.3.0',
  summary: 'Custom functionality for the Learners Guild game (including slash commands for Rocket.Chat).',
})

/* eslint-disable prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.2.1')

  api.use([
    'ecmascript',
    'deepwell:raven@0.3.0',
    'learnersguild:rocketchat-lg-core@1.0.0',
    'learnersguild:rocketchat-lg-sso@1.0.0',
  ])
  api.use([
    'rocketchat:lib@0.0.1'
  ], {weak: true, unordered: false})
  api.use([
    'templating'
  ], 'client')

  api.addFiles([
    'common/util/logger.js',
    'common/util/tokenizeCommandString.js',
    'common/commandFuncs.js',
  ])
  api.addFiles([
    'client/commands/index.js',
    'client/commands/profile.js',
    'client/commands/retro.js',
    'client/commands/vote.js',
    'client/commands/playbook.js',
    'client/util/flexPanel.js',
    'client/views/flexPanelIframe.html',
    'client/views/flexPanelIframe.js',
  ], 'client')
  api.addFiles([
    'server/commands/index.js',
    'server/util/format.js',
    'server/util/notifyUser.js',
    'server/afterCreateUser.js',
  ], 'server')
})

Npm.depends({
  '@learnersguild/game-cli': '1.3.0',
  'socketcluster-client': '4.3.17'
})
