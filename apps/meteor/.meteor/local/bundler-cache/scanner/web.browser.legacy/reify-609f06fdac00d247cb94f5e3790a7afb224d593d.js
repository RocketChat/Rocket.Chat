var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Button,Field,FieldHint,FieldLabel,FieldRow,Modal;module.link('@rocket.chat/fuselage',{Button:function(v){Button=v},Field:function(v){Field=v},FieldHint:function(v){FieldHint=v},FieldLabel:function(v){FieldLabel=v},FieldRow:function(v){FieldRow=v},Modal:function(v){Modal=v}},1);var useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId:function(v){useUniqueId=v}},2);var UserAutoComplete;module.link('@rocket.chat/ui-client',{UserAutoComplete:function(v){UserAutoComplete=v}},3);var useEndpoint,useUser;module.link('@rocket.chat/ui-contexts',{useEndpoint:function(v){useEndpoint=v},useUser:function(v){useUser=v}},4);var useQuery;module.link('@tanstack/react-query',{useQuery:function(v){useQuery=v}},5);var useState;module.link('react',{useState:function(v){useState=v}},6);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},7);







const VoipTransferModal = ({ extension, isLoading = false, onCancel, onConfirm }) => {
    const { t } = useTranslation();
    const [username, setTransferTo] = useState('');
    const user = useUser();
    const transferToId = useUniqueId();
    const modalId = useUniqueId();
    const getUserInfo = useEndpoint('GET', '/v1/users.info');
    const { data: targetUser, isInitialLoading: isTargetInfoLoading } = useQuery(['/v1/users.info', username], () => getUserInfo({ username }), {
        enabled: Boolean(username),
        select: (data) => (data === null || data === void 0 ? void 0 : data.user) || {},
    });
    const handleConfirm = () => {
        if (!(targetUser === null || targetUser === void 0 ? void 0 : targetUser.freeSwitchExtension)) {
            return;
        }
        onConfirm({ extension: targetUser.freeSwitchExtension, name: targetUser.name });
    };
    return (_jsxs(Modal, { open: true, "aria-labelledby": modalId, children: [_jsxs(Modal.Header, { children: [_jsx(Modal.Icon, { color: 'danger', name: 'modal-warning' }), _jsx(Modal.Title, { id: modalId, children: t('Transfer_call') }), _jsx(Modal.Close, { "aria-label": t('Close'), onClick: onCancel })] }), _jsx(Modal.Content, { children: _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: transferToId, children: t('Transfer_to') }), _jsx(FieldRow, { children: _jsx(UserAutoComplete, { id: transferToId, value: username, "aria-describedby": `${transferToId}-hint`, "data-testid": 'vc-input-transfer-to', onChange: (target) => setTransferTo(target), multiple: false, conditions: {
                                    freeSwitchExtension: { $exists: true, $ne: extension },
                                    username: { $ne: user === null || user === void 0 ? void 0 : user.username },
                                } }) }), _jsx(FieldHint, { id: `${transferToId}-hint`, children: t('Select_someone_to_transfer_the_call_to') })] }) }), _jsx(Modal.Footer, { children: _jsxs(Modal.FooterControllers, { children: [_jsx(Button, { "data-testid": 'vc-button-cancel', secondary: true, onClick: onCancel, children: t('Cancel') }), _jsx(Button, { danger: true, onClick: handleConfirm, disabled: !(targetUser === null || targetUser === void 0 ? void 0 : targetUser.freeSwitchExtension), loading: isLoading || isTargetInfoLoading, children: t('Hang_up_and_transfer_call') })] }) })] }));
};
module.exportDefault(VoipTransferModal);
//# sourceMappingURL=VoipTransferModal.js.map