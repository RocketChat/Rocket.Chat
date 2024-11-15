let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Button,Field,FieldHint,FieldLabel,FieldRow,Modal;module.link('@rocket.chat/fuselage',{Button(v){Button=v},Field(v){Field=v},FieldHint(v){FieldHint=v},FieldLabel(v){FieldLabel=v},FieldRow(v){FieldRow=v},Modal(v){Modal=v}},1);let useUniqueId;module.link('@rocket.chat/fuselage-hooks',{useUniqueId(v){useUniqueId=v}},2);let UserAutoComplete;module.link('@rocket.chat/ui-client',{UserAutoComplete(v){UserAutoComplete=v}},3);let useEndpoint,useUser;module.link('@rocket.chat/ui-contexts',{useEndpoint(v){useEndpoint=v},useUser(v){useUser=v}},4);let useQuery;module.link('@tanstack/react-query',{useQuery(v){useQuery=v}},5);let useState;module.link('react',{useState(v){useState=v}},6);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},7);







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