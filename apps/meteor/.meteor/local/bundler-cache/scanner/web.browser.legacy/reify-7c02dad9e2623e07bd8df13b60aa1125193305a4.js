var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box,IconButton,Skeleton;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},IconButton:function(v){IconButton=v},Skeleton:function(v){Skeleton=v}},1);var UserAvatar;module.link('@rocket.chat/ui-avatar',{UserAvatar:function(v){UserAvatar=v}},2);var useToastMessageDispatch;module.link('@rocket.chat/ui-contexts',{useToastMessageDispatch:function(v){useToastMessageDispatch=v}},3);var useMutation;module.link('@tanstack/react-query',{useMutation:function(v){useMutation=v}},4);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},5);





const VoipContactId = ({ name, username, transferedBy, isLoading = false, }) => {
    const dispatchToastMessage = useToastMessageDispatch();
    const { t } = useTranslation();
    const handleCopy = useMutation({
        mutationFn: (contactName) => navigator.clipboard.writeText(contactName),
        onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Phone_number_copied') }),
        onError: () => dispatchToastMessage({ type: 'error', message: t('Failed_to_copy_phone_number') }),
    });
    if (!name) {
        return null;
    }
    if (isLoading) {
        return (_jsxs(Box, { display: 'flex', pi: 12, pb: 8, children: [_jsx(Skeleton, { variant: 'rect', size: 20, mie: 8 }), _jsx(Skeleton, { variant: 'text', width: 100, height: 16 })] }));
    }
    return (_jsxs(Box, { pi: 12, pbs: 4, pbe: 8, children: [transferedBy && (_jsxs(Box, { mbe: 8, fontScale: 'p2', color: 'secondary-info', children: [t('From'), ": ", transferedBy] })), _jsxs(Box, { display: 'flex', children: [username && (_jsx(Box, { flexShrink: 0, mie: 8, children: _jsx(UserAvatar, { username: username, size: 'x24' }) })), _jsx(Box, { withTruncatedText: true, is: 'p', fontScale: 'p1', mie: 'auto', color: 'secondary-info', flexGrow: 1, flexShrink: 1, title: name, children: name }), !username && (_jsx(IconButton, { mini: true, "aria-label": t('Copy_phone_number'), "data-tooltip": t('Copy_phone_number'), mis: 6, icon: 'copy', onClick: () => handleCopy.mutate(name) }))] })] }));
};
module.exportDefault(VoipContactId);
//# sourceMappingURL=VoipContactId.js.map