// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by redlink-search-lib.js.
import { name as packageName } from "meteor/rocketchat:search-redlink";

// Write your tests here!
// Here is an example.
Tinytest.add('search-redlink - example', function (test) {
  test.equal(packageName, "search-redlink");
});
