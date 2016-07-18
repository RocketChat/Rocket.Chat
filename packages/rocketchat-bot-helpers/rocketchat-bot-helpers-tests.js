// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by rocketchat-bot-helpers.js.
import { name as packageName } from "meteor/rocketchat-bot-helpers";

// Write your tests here!
// Here is an example.
Tinytest.add('rocketchat-bot-helpers - example', function (test) {
  test.equal(packageName, "rocketchat-bot-helpers");
});
