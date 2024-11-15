let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let useEffectEvent,useLocalStorage;module.link('@rocket.chat/fuselage-hooks',{useEffectEvent(v){useEffectEvent=v},useLocalStorage(v){useLocalStorage=v}},1);let usePermission,useSetInputMediaDevice,useSetOutputMediaDevice,useSetting,useToastMessageDispatch;module.link('@rocket.chat/ui-contexts',{usePermission(v){usePermission=v},useSetInputMediaDevice(v){useSetInputMediaDevice=v},useSetOutputMediaDevice(v){useSetOutputMediaDevice=v},useSetting(v){useSetting=v},useToastMessageDispatch(v){useToastMessageDispatch=v}},2);let useEffect,useMemo,useRef;module.link('react',{useEffect(v){useEffect=v},useMemo(v){useMemo=v},useRef(v){useRef=v}},3);let createPortal;module.link('react-dom',{createPortal(v){createPortal=v}},4);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},5);let VoipPopup;module.link('../components/VoipPopup',{default(v){VoipPopup=v}},6);let VoipPopupPortal;module.link('../components/VoipPopupPortal',{default(v){VoipPopupPortal=v}},7);let VoipContext;module.link('../contexts/VoipContext',{VoipContext(v){VoipContext=v}},8);let useVoipClient;module.link('../hooks/useVoipClient',{useVoipClient(v){useVoipClient=v}},9);let useVoipSounds;module.link('../hooks/useVoipSounds',{useVoipSounds(v){useVoipSounds=v}},10);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};











const VoipProvider = ({ children }) => {
    // Settings
    const isVoipSettingEnabled = useSetting('VoIP_TeamCollab_Enabled') || false;
    const canViewVoipRegistrationInfo = usePermission('view-user-voip-extension');
    const isVoipEnabled = isVoipSettingEnabled && canViewVoipRegistrationInfo;
    const [isLocalRegistered, setStorageRegistered] = useLocalStorage('voip-registered', true);
    // Hooks
    const { t } = useTranslation();
    const voipSounds = useVoipSounds();
    const { voipClient, error } = useVoipClient({
        enabled: isVoipEnabled,
        autoRegister: isLocalRegistered,
    });
    const setOutputMediaDevice = useSetOutputMediaDevice();
    const setInputMediaDevice = useSetInputMediaDevice();
    const dispatchToastMessage = useToastMessageDispatch();
    // Refs
    const remoteAudioMediaRef = useRef(null);
    useEffect(() => {
        if (!voipClient) {
            return;
        }
        const onBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = true;
        };
        const onCallEstablished = () => __awaiter(void 0, void 0, void 0, function* () {
            voipSounds.stopAll();
            window.addEventListener('beforeunload', onBeforeUnload);
            if (voipClient.isCallee() && remoteAudioMediaRef.current) {
                voipClient.switchMediaRenderer({ remoteMediaElement: remoteAudioMediaRef.current });
            }
        });
        const onNetworkDisconnected = () => {
            if (voipClient.isOngoing()) {
                voipClient.endCall();
            }
        };
        const onOutgoingCallRinging = () => {
            voipSounds.play('outbound-call-ringing');
        };
        const onIncomingCallRinging = () => {
            voipSounds.play('telephone');
        };
        const onCallTerminated = () => {
            voipSounds.play('call-ended', false);
            voipSounds.stopAll();
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
        const onRegistrationError = () => {
            setStorageRegistered(false);
            dispatchToastMessage({ type: 'error', message: t('Voice_calling_registration_failed') });
        };
        const onRegistered = () => {
            setStorageRegistered(true);
        };
        const onUnregister = () => {
            setStorageRegistered(false);
        };
        voipClient.on('incomingcall', onIncomingCallRinging);
        voipClient.on('outgoingcall', onOutgoingCallRinging);
        voipClient.on('callestablished', onCallEstablished);
        voipClient.on('callterminated', onCallTerminated);
        voipClient.on('registrationerror', onRegistrationError);
        voipClient.on('registered', onRegistered);
        voipClient.on('unregistered', onUnregister);
        voipClient.networkEmitter.on('disconnected', onNetworkDisconnected);
        voipClient.networkEmitter.on('connectionerror', onNetworkDisconnected);
        voipClient.networkEmitter.on('localnetworkoffline', onNetworkDisconnected);
        return () => {
            voipClient.off('incomingcall', onIncomingCallRinging);
            voipClient.off('outgoingcall', onOutgoingCallRinging);
            voipClient.off('callestablished', onCallEstablished);
            voipClient.off('callterminated', onCallTerminated);
            voipClient.off('registrationerror', onRegistrationError);
            voipClient.off('registered', onRegistered);
            voipClient.off('unregistered', onUnregister);
            voipClient.networkEmitter.off('disconnected', onNetworkDisconnected);
            voipClient.networkEmitter.off('connectionerror', onNetworkDisconnected);
            voipClient.networkEmitter.off('localnetworkoffline', onNetworkDisconnected);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [dispatchToastMessage, setStorageRegistered, t, voipClient, voipSounds]);
    const changeAudioOutputDevice = useEffectEvent((selectedAudioDevice) => __awaiter(void 0, void 0, void 0, function* () {
        if (!remoteAudioMediaRef.current) {
            return;
        }
        setOutputMediaDevice({ outputDevice: selectedAudioDevice, HTMLAudioElement: remoteAudioMediaRef.current });
    }));
    const changeAudioInputDevice = useEffectEvent((selectedAudioDevice) => __awaiter(void 0, void 0, void 0, function* () {
        if (!voipClient) {
            return;
        }
        yield voipClient.changeAudioInputDevice({ audio: { deviceId: { exact: selectedAudioDevice.id } } });
        setInputMediaDevice(selectedAudioDevice);
    }));
    const contextValue = useMemo(() => {
        if (!isVoipEnabled) {
            return {
                isEnabled: false,
                voipClient: null,
                error: null,
                changeAudioInputDevice,
                changeAudioOutputDevice,
            };
        }
        if (!voipClient || error) {
            return {
                isEnabled: true,
                voipClient: null,
                error,
                changeAudioInputDevice,
                changeAudioOutputDevice,
            };
        }
        return {
            isEnabled: true,
            voipClient,
            changeAudioInputDevice,
            changeAudioOutputDevice,
        };
    }, [voipClient, isVoipEnabled, error, changeAudioInputDevice, changeAudioOutputDevice]);
    return (_jsxs(VoipContext.Provider, { value: contextValue, children: [children, contextValue.isEnabled &&
                createPortal(_jsx("audio", { ref: remoteAudioMediaRef, children: _jsx("track", { kind: 'captions' }) }), document.body), _jsx(VoipPopupPortal, { children: _jsx(VoipPopup, { position: { bottom: 132, right: 24 } }) })] }));
};
module.exportDefault(VoipProvider);
//# sourceMappingURL=VoipProvider.js.map