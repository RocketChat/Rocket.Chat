// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from 'meteor/tinytest';

// Import and rename a variable exported by rocketchat-drive-upload.js.
import { name as packageName } from 'meteor/rocketchat:rocketchat-drive-upload';

// Write your tests here!
// Here is an example.
Tinytest.add('rocketchat-drive-upload - example', function(test) {
	test.equal(packageName, 'rocketchat-drive-upload');
});
