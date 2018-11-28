import newConnection from './newConnection';
import removeConnection from './removeConnection';
import removeLostConnections from './removeLostConnections';
import setStatus from './setStatus';
export default {
	...newConnection,
	...removeConnection,
	...removeLostConnections,
	...setStatus,
};
