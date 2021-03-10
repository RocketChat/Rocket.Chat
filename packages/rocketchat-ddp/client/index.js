import { ClientStream } from 'meteor/socket-stream-client';

ClientStream.prototype._launchConnectionAsync = ClientStream.prototype._launchConnection;
ClientStream.prototype._launchConnection = function() {};
