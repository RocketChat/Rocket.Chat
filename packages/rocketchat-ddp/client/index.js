import { ClientStream } from 'meteor/socket-stream-client';

ClientStream.prototype.connectionAllowed = false;
ClientStream.prototype.allowConnection = function(allow = true) {
	this.connectionAllowed = allow;
	this._launchConnection();
};

ClientStream.prototype._launchConnectionAsync = ClientStream.prototype._launchConnection;
ClientStream.prototype._launchConnection = function() {
	if (!this.connectionAllowed) {
		return;
	}
	this._launchConnectionAsync();
};
