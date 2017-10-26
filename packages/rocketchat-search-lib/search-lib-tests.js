// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by search-lib.js.
import { name as packageName } from "meteor/rocketchat:search";

// Write your tests here!
// Here is an example.
Tinytest.add('search - example', function (test) {
  test.equal(packageName, "search");
});
