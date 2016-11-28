/* eslint-disable prefer-arrow-callback */
/* global logger */

Meteor.startup(function () {
  Meteor.call('getSentryClientDSN', (err, sentryClientDSN) => {
    if (err) {
      logger.error('ERROR invoking getSentryClientDSN(): could not get Sentry client DSN.')
      return
    }
    if (sentryClientDSN) {
      try {
        RavenLogger.initialize({
          client: sentryClientDSN,
        })
      } catch (err) {
        logger.info('Sentry (Raven) already initialized.')
      }
    }
  })
})
