module.export({useVoipContactId:function(){return useVoipContactId}},true);var useVoipExtensionDetails;module.link('./useVoipExtensionDetails',{useVoipExtensionDetails:function(v){useVoipExtensionDetails=v}},0);
const useVoipContactId = ({ session, transferEnabled = true }) => {
    var _a, _b;
    const { data: contact, isInitialLoading: isLoading } = useVoipExtensionDetails({ extension: session.contact.id });
    const { data: transferedByContact } = useVoipExtensionDetails({
        extension: (_a = session.transferedBy) === null || _a === void 0 ? void 0 : _a.id,
        enabled: transferEnabled,
    });
    const getContactName = (data, defaultValue) => {
        const { name, username = '', callerName, callerNumber, extension } = data || {};
        return name || callerName || username || callerNumber || extension || defaultValue || '';
    };
    const name = getContactName(contact, session.contact.name || session.contact.id);
    const transferedBy = getContactName(transferedByContact, transferEnabled ? (_b = session.transferedBy) === null || _b === void 0 ? void 0 : _b.id : '');
    return {
        name,
        username: contact === null || contact === void 0 ? void 0 : contact.username,
        transferedBy,
        isLoading,
    };
};
//# sourceMappingURL=useVoipContactId.js.map