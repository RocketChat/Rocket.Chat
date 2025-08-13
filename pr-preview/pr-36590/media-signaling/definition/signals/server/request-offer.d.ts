/** Server is requesting a webrtc offer */
export type ServerMediaSignalRequestOffer = {
    callId: string;
    toContractId: string;
    type: 'request-offer';
    iceRestart?: boolean;
};
//# sourceMappingURL=request-offer.d.ts.map