let _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},Fragment(v){_Fragment=v},jsxs(v){_jsxs=v}},0);let Message;module.link('@rocket.chat/fuselage',{Message(v){Message=v}},1);let memo,useContext,useMemo;module.link('react',{memo(v){memo=v},useContext(v){useContext=v},useMemo(v){useMemo=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);let MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext(v){MarkupInteractionContext=v}},4);




const handleUserMention = (mention, withSymbol) => withSymbol ? `@${mention}` : mention;
const UserMentionElement = ({ mention }) => {
    var _a;
    const { t } = useTranslation();
    const { resolveUserMention, onUserMentionClick, ownUserId, useRealName, showMentionSymbol, triggerProps } = useContext(MarkupInteractionContext);
    const resolved = useMemo(() => resolveUserMention === null || resolveUserMention === void 0 ? void 0 : resolveUserMention(mention), [mention, resolveUserMention]);
    const handleClick = useMemo(() => (resolved ? onUserMentionClick === null || onUserMentionClick === void 0 ? void 0 : onUserMentionClick(resolved) : undefined), [resolved, onUserMentionClick]);
    if (mention === 'all') {
        return (_jsx(Message.Highlight, { title: t('Mentions_all_room_members'), variant: 'relevant', children: handleUserMention('all', showMentionSymbol) }));
    }
    if (mention === 'here') {
        return (_jsx(Message.Highlight, { title: t('Mentions_online_room_members'), variant: 'relevant', children: handleUserMention('here', showMentionSymbol) }));
    }
    if (!resolved) {
        return _jsxs(_Fragment, { children: ["@", mention] });
    }
    return (_jsx(Message.Highlight, Object.assign({ variant: resolved._id === ownUserId ? 'critical' : 'other', title: resolved._id === ownUserId ? t('Mentions_you') : t('Mentions_user'), clickable: true, tabIndex: 0, role: 'button', onClick: handleClick, onKeyDown: (e) => {
            (e.code === 'Enter' || e.code === 'Space') && (handleClick === null || handleClick === void 0 ? void 0 : handleClick(e));
        } }, triggerProps, { "data-uid": resolved._id, children: handleUserMention((_a = (useRealName ? resolved.name : resolved.username)) !== null && _a !== void 0 ? _a : mention, showMentionSymbol) })));
};
module.exportDefault(memo(UserMentionElement));
//# sourceMappingURL=UserMentionElement.js.map