import lineReader from 'line-reader';
import program from 'commander';
import wait from 'wait.for';
import {MongoClient} from 'mongodb';

program.usage('[options]').option('-v, --verbose', 'Verbose', (function(v, total) {
	return total + 1;
}), 0).option('-M, --mongo-db [mongo db]', 'Mongo DB', 'localhost:27017').option('-N, --db-name [db name]', 'DB Name', 'meteor').on('--help', function() {
	console.log('  Example:');
	console.log('');
	console.log('    $ node unsubscribe.js');
	return console.log('');
}).parse(process.argv);

wait.launchFiber(function() {
	const db = wait.forMethod(MongoClient, 'connect', `mongodb://${ program.mongoDb }/${ program.dbName }`, {
		replSet: {
			socketOptions: {
				connectTimeoutMS: 300000
			}
		}
	});

	const User = db.collection('users');
	return lineReader.eachLine('./unsubscribe.csv', function(line, last) {
		const row = line.split(',');
		if (program.verbose) {
			console.log(row[0]);
		}
		return wait.launchFiber(function() {
			wait.forMethod(User, 'update', {
				'emails.address': row[0]
			}, {
				$set: {
					'mailer.unsubscribed': true
				}
			});

			if (last) {
				return process.exit();
			}
		});
	});
});
