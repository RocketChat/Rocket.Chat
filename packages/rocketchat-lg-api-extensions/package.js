Package.describe({
  name: 'learnersguild:rocketchat-lg-api-extensions',
  version: '1.0.1',
  summary: 'Custom API extensions for Rocket.Chat within Learners Guild.',
  git: 'https://github.com/LearnersGuild/rocketchat-lg-api-extensions'
})

/* eslint-disable prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.2.1')

  api.use([
    'ecmascript',
    'deepwell:raven@0.3.0',
    'learnersguild:rocketchat-lg-core@1.0.0',
  ])
  api.use([
    'nimble:restivus@0.8.10',
    'rocketchat:lib@0.0.1',
  ], {weak: true, unordered: false})

  api.addFiles([
    'server/api.js',
  ], 'server')
})
