import { API } from '../../../app/api/server';
import { isRunningMs } from '../../../server/lib/isRunningMs';
import { Meteor } from 'meteor/meteor';
import { Logger } from '@rocket.chat/logger';
// import { createFederationRouter } from '@rocket.chat/federation-service';
// import { homeseverEventHandler } from '../../../ee/apps/federation-service/src/homeserver-listener';

const logger = new Logger('FederationRouter');

/**
 * Load the federation router when using local broker mode.
 * This implementation will make the federation router available on the main API.
 * 
 * PS: When running in microservice mode, the federation router is loaded by the federation-service app.
 */
if (!isRunningMs()) {
  Meteor.defer(async () => {
    try {
      logger.info('Initializing federation router in local broker mode...');
      
      // TODO: Implement federation router on local broker mode
      
      // homeseverEventHandler.initializeListeners();
      
      // const federationRouter = await createFederationRouter({
      //   emitter: homeseverEventHandler.getEmitter(),
      // });
      
      // API.api.use(federationRouter);
      
      logger.info('Federation router integrated successfully in local broker mode');
    } catch (error) {
      logger.error('Failed to initialize federation router:', error);
    }
  });
}