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
 * This will raise an error of bindEnvironment and block the observer
 * here https://github.com/meteor/meteor/blob/be6e529a739f47446950e045f4547ee60e5de7ae/packages/mongo/oplog_observe_driver.js#L698
 *
 * This code will check for observer instances in QUERYING mode for more than 2 minutes and will manually set them back
 * to STEADY and force the query again to refresh the data and flush the _writesToCommitWhenWeReachSteady callbacks.
 */

setInterval(() => {
	if (debug) {
		console.log('Checking for stuck observers');
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
