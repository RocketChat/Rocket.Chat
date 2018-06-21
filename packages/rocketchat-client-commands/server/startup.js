const commandStream = new Meteor.Streamer('client-commands');
this.commandStream = commandStream;

commandStream.allowWrite('none');

commandStream.allowRead('all');
