if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to example.";
  };

  Template.hello.events({
    'click input': function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });
}

if (Meteor.isServer) {
  // optionally set the collection's name that synced cron will use
  SyncedCron.config({
    collectionName: 'somethingDifferent'
  });

  SyncedCron.add({
    name: 'Crunch some important numbers for the marketing department',
    schedule: function(parser) {
      // parser is a later.parse object
      return parser.text('every 5 seconds');
    }, 
    job: function(intendedAt) {
      console.log('crunching numbers');
      console.log('job should be running at:');
      console.log(intendedAt);
    }
  });
  
  Meteor.startup(function () {
    // code to run on server at startup
    SyncedCron.start();
    
    // Stop jobs after 15 seconds
    Meteor.setTimeout(function() { SyncedCron.stop(); }, 15 * 1000);
  });
}
