Package.describe({
  name: 'learnersguild:rocketchat-lg-core',
  version: '1.0.1',
  summary: 'Core utilities, libraries, and global functionality for all Learners Guild RocketChat-related packages.',
})

/* eslint-disable prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.2.1')

  api.use([
    'ecmascript',
    'deepwell:raven@0.3.0',
  ])
  api.use([
    'rocketchat:lib@0.0.1'
  ], {weak: true, unordered: false})

  api.addFiles([
    'client/mapEmoji.js',
    'client/sentry.js',
  ], 'client')
  api.addFiles([
    'common/util/getPackageLogger.js',
    'common/util/getServiceBaseURL.js',
    'common/util/graphQLFetcher.js',
  ])
  api.addFiles([
    'server/prepareServer.js',
    'server/sentry.js',
  ], 'server')

  api.export([
    'GAME',
    'IDM',
    'apiHeaders',
    'getPackageLogger',
    'getServiceBaseURL',
    'graphQLFetcher',
    'rawGraphQLFetcher',
  ])
  api.export([
    'LG_BOT_USERNAME',
  ], 'server')
})
