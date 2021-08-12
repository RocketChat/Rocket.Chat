import { ClientStream } from 'meteor/socket-stream-client';

const { _launchConnection } = ClientStream.prototype;
ClientStream.prototype.allowConnection = function() {
	_launchConnection.call(this);
	ClientStream.prototype._launchConnection = _launchConnection;
};

ClientStream.prototype._launchConnection = function() {
};
