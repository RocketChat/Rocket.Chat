module.export({useVoipDeviceSettings:()=>useVoipDeviceSettings},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box,RadioButton;module.link('@rocket.chat/fuselage',{Box(v){Box=v},RadioButton(v){RadioButton=v}},1);let useAvailableDevices,useSelectedDevices,useToastMessageDispatch;module.link('@rocket.chat/ui-contexts',{useAvailableDevices(v){useAvailableDevices=v},useSelectedDevices(v){useSelectedDevices=v},useToastMessageDispatch(v){useToastMessageDispatch=v}},2);let useMutation;module.link('@tanstack/react-query',{useMutation(v){useMutation=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);let useVoipAPI;module.link('../../../hooks/useVoipAPI',{useVoipAPI(v){useVoipAPI=v}},5);





const useVoipDeviceSettings = () => {
    var _a, _b;
    const { t } = useTranslation();
    const dispatchToastMessage = useToastMessageDispatch();
    const { changeAudioInputDevice, changeAudioOutputDevice } = useVoipAPI();
    const availableDevices = useAvailableDevices();
    const selectedAudioDevices = useSelectedDevices();
    const changeInputDevice = useMutation({
        mutationFn: changeAudioInputDevice,
        onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Devices_Set') }),
        onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
    });
    const changeOutputDevice = useMutation({
        mutationFn: changeAudioOutputDevice,
        onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Devices_Set') }),
        onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
    });
    const availableInputDevice = ((_a = availableDevices === null || availableDevices === void 0 ? void 0 : availableDevices.audioInput) === null || _a === void 0 ? void 0 : _a.map((device) => {
        var _a;
        return ({
            id: device.id,
            content: (_jsx(Box, { is: 'span', title: device.label, fontSize: 14, children: device.label })),
            addon: _jsx(RadioButton, { onChange: () => changeInputDevice.mutate(device), checked: device.id === ((_a = selectedAudioDevices === null || selectedAudioDevices === void 0 ? void 0 : selectedAudioDevices.audioInput) === null || _a === void 0 ? void 0 : _a.id) }),
        });
    })) || [];
    const availableOutputDevice = ((_b = availableDevices === null || availableDevices === void 0 ? void 0 : availableDevices.audioOutput) === null || _b === void 0 ? void 0 : _b.map((device) => {
        var _a;
        return ({
            id: device.id,
            content: (_jsx(Box, { is: 'span', title: device.label, fontSize: 14, children: device.label })),
            addon: (_jsx(RadioButton, { onChange: () => changeOutputDevice.mutate(device), checked: device.id === ((_a = selectedAudioDevices === null || selectedAudioDevices === void 0 ? void 0 : selectedAudioDevices.audioOutput) === null || _a === void 0 ? void 0 : _a.id) })),
            onClick(e) {
                e === null || e === void 0 ? void 0 : e.preventDefault();
                e === null || e === void 0 ? void 0 : e.stopPropagation();
            },
        });
    })) || [];
    const micSection = {
        title: t('Microphone'),
        items: availableInputDevice,
    };
    const speakerSection = {
        title: t('Speaker'),
        items: availableOutputDevice,
    };
    const disabled = !micSection.items.length || !speakerSection.items.length;
    return {
        disabled,
        title: disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings'),
        sections: [micSection, speakerSection],
    };
};
//# sourceMappingURL=useVoipDeviceSettings.js.map