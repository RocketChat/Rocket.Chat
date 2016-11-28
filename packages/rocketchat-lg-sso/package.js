Package.describe({
  name: 'learnersguild:rocketchat-lg-sso',
  version: '1.0.1',
  summary: 'Accounts login handler for Learners Guild SSO.',
})

/* eslint-disable prefer-arrow-callback */
Package.onUse(function (api) {
  api.versionsFrom('1.2.1')

  api.use([
    'ecmascript',
    'deepwell:raven@0.3.0',
    'evaisse:http-query-string@0.0.1',
    'learnersguild:rocketchat-lg-core@1.0.0',
  ])
  api.use([
    'rocketchat:lib@0.0.1',
  ], {weak: true, unordered: false})
  api.use([
    'templating'
  ], 'client')
  api.use([
    'accounts-base',
    'webapp',
  ], 'server')

  api.addFiles([
    'client/sso.js',
    'client/slidingSession.js',
  ], 'client')
  api.addFiles([
    'common/util/logger.js',
  ])
  api.addFiles([
    'server/sso.js',
  ], 'server')

  api.export('userFromJWT', 'server')
})

Npm.depends({
  '@learnersguild/idm-jwt-auth': '1.0.0'
})
