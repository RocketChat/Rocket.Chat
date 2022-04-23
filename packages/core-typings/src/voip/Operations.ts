/**
 * Enumerator representing current operation.
 * @remarks
 * This enumerator value along with callstate will be responsible for
 * valid actions while making/receiving a call to/from remote party.
 */
export enum Operation {
	OP_NONE,
	OP_CONNECT,
	OP_REGISTER,
	OP_UNREGISTER,
	OP_PROCESS_INVITE,
	OP_CLEANUP,
}
