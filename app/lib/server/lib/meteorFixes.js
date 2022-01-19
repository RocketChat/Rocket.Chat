import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

const timeoutQuery = parseInt(process.env.OBSERVERS_CHECK_TIMEOUT) || 2 * 60 * 1000;
const interval = parseInt(process.env.OBSERVERS_CHECK_INTERVAL) || 60 * 1000;
const debug = Boolean(process.env.OBSERVERS_CHECK_DEBUG);

/**
 * When the Observer Driver stuck in QUERYING status it stop processing records
 * here https://github.com/meteor/meteor/blob/be6e529a739f47446950e045f4547ee60e5de7ae/packages/mongo/oplog_observe_driver.js#L166
 * and nothing is able to change the status back to STEADY.
 * If this happens with the User's collection the frontend will freeze after login with username/password or resume token
 * waiting the 'update' response from DDP
 * here https://github.com/meteor/meteor/blob/be6e529a739f47446950e045f4547ee60e5de7ae/packages/ddp-server/livedata_server.js#L663
 * since the login is a block request and wait for the update to execute next calls.
 *
 * A good way to freeze a observer is running the instance with --inspect and execute in inspector the following code:
 *   multiplexer = Object.values(MongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers)[0]
 *   multiplexer._observeDriver._needToPollQuery()
 * Whis will raise an error of bindEnvironment and block the observer
 * here https://github.com/meteor/meteor/blob/be6e529a739f47446950e045f4547ee60e5de7ae/packages/mongo/oplog_observe_driver.js#L698
 *
 * This code will check for observer instances in QUERYING mode for more than 2 minutues and will manually set them back
 * to STEADY and force the query again to refresh the data and flush the _writesToCommitWhenWeReachSteady callbacks.
 */

Meteor.setInterval(() => {
	if (debug) {
		console.log('Checking for stucked observers');
	}
	const now = Date.now();
	const driver = MongoInternals.defaultRemoteCollectionDriver();

	Object.entries(driver.mongo._observeMultiplexers)
		.filter(([, { _observeDriver }]) => _observeDriver._phase === 'QUERYING' && timeoutQuery < now - _observeDriver._phaseStartTime)
		.forEach(([observeKey, { _observeDriver }]) => {
			console.error('TIMEOUT QUERY OPERATION', {
				observeKey,
				writesToCommitWhenWeReachSteadyLength: _observeDriver._writesToCommitWhenWeReachSteady.length,
				cursorDescription: JSON.stringify(_observeDriver._cursorDescription),
			});
			_observeDriver._registerPhaseChange('STEADY');
			_observeDriver._needToPollQuery();
		});
}, interval);

/**
 * If some promise is rejected and doesn't have a catch (unhandledRejection) it may cause this finally
 * here https://github.com/meteor/meteor/blob/be6e529a739f47446950e045f4547ee60e5de7ae/packages/mongo/oplog_tailing.js#L348
 * to not be executed never ending the oplog worker and freezing the entire process.
 *
 * The only way to release the process is executing the following code via inspect:
 *   MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle._workerActive = false
 *
 * Since unhandled rejections are deprecated in NodeJS:
 * (node:83382) [DEP0018] DeprecationWarning: Unhandled promise rejections are deprecated. In the future, promise rejections
 * that are not handled will terminate the Node.js process with a non-zero exit code.
 * we will start respecting this and exit the process to prevent these kind of problems.
 */

process.on('unhandledRejection', (error) => {
	console.error('=== UnHandledPromiseRejection ===');
	console.error(error);
	console.error('---------------------------------');
	console.error('Errors like this can cause oplog processing errors.');
	console.error(
		'Setting EXIT_UNHANDLEDPROMISEREJECTION will cause the process to exit allowing your service to automatically restart the process',
	);
	console.error('Future node.js versions will automatically exit the process');
	console.error('=================================');

	if (process.env.NODE_ENV === 'development' || process.env.EXIT_UNHANDLEDPROMISEREJECTION) {
		process.exit(1);
	}
});
