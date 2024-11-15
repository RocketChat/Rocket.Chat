var _jsx,_Fragment,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},Fragment:function(v){_Fragment=v},jsxs:function(v){_jsxs=v}},0);var Message;module.link('@rocket.chat/fuselage',{Message:function(v){Message=v}},1);var memo,useContext,useMemo;module.link('react',{memo:function(v){memo=v},useContext:function(v){useContext=v},useMemo:function(v){useMemo=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext:function(v){MarkupInteractionContext=v}},4);




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