module.export({defaultSessionDescriptionHandlerFactory:function(){return defaultSessionDescriptionHandlerFactory}});var defaultMediaStreamFactory;module.link("./media-stream-factory-default",{defaultMediaStreamFactory:function(v){defaultMediaStreamFactory=v}},0);var defaultPeerConnectionConfiguration;module.link("./peer-connection-configuration-default",{defaultPeerConnectionConfiguration:function(v){defaultPeerConnectionConfiguration=v}},1);var SessionDescriptionHandler;module.link("./session-description-handler",{SessionDescriptionHandler:function(v){SessionDescriptionHandler=v}},2);


/**
 * Function which returns a SessionDescriptionHandlerFactory.
 * @remarks
 * See {@link defaultPeerConnectionConfiguration} for the default peer connection configuration.
 * The ICE gathering timeout defaults to 5000ms.
 * @param mediaStreamFactory - MediaStream factory.
 * @public
 */
function defaultSessionDescriptionHandlerFactory(mediaStreamFactory) {
    return (session, options) => {
        // provide a default media stream factory if need be
        if (mediaStreamFactory === undefined) {
            mediaStreamFactory = defaultMediaStreamFactory();
        }
        // make sure we allow `0` to be passed in so timeout can be disabled
        const iceGatheringTimeout = (options === null || options === void 0 ? void 0 : options.iceGatheringTimeout) !== undefined ? options === null || options === void 0 ? void 0 : options.iceGatheringTimeout : 5000;
        // merge passed factory options into default session description configuration
        const sessionDescriptionHandlerConfiguration = {
            iceGatheringTimeout,
            peerConnectionConfiguration: Object.assign(Object.assign({}, defaultPeerConnectionConfiguration()), options === null || options === void 0 ? void 0 : options.peerConnectionConfiguration)
        };
        const logger = session.userAgent.getLogger("sip.SessionDescriptionHandler");
        return new SessionDescriptionHandler(logger, mediaStreamFactory, sessionDescriptionHandlerConfiguration);
    };
}
