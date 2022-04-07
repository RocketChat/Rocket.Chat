module.export({Ack:()=>Ack});/**
 * A request to confirm a {@link Session} (incoming ACK).
 * @public
 */
class Ack {
    /** @internal */
    constructor(incomingAckRequest) {
        this.incomingAckRequest = incomingAckRequest;
    }
    /** Incoming ACK request message. */
    get request() {
        return this.incomingAckRequest.message;
    }
}
