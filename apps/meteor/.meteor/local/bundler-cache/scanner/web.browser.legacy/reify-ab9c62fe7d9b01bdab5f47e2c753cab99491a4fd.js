var _Fragment,_jsxs,_jsx;module.link("react/jsx-runtime",{Fragment:function(v){_Fragment=v},jsxs:function(v){_jsxs=v},jsx:function(v){_jsx=v}},0);var Message;module.link('@rocket.chat/fuselage',{Message:function(v){Message=v}},1);var memo,useContext,useMemo;module.link('react',{memo:function(v){memo=v},useContext:function(v){useContext=v},useMemo:function(v){useMemo=v}},2);var useTranslation;module.link('react-i18next',{useTranslation:function(v){useTranslation=v}},3);var MarkupInteractionContext;module.link('../MarkupInteractionContext',{MarkupInteractionContext:function(v){MarkupInteractionContext=v}},4);




const handleChannelMention = (mention, withSymbol) => (withSymbol ? `#${mention}` : mention);
const ChannelMentionElement = ({ mention }) => {
    var _a;
    const { t } = useTranslation();
    const { resolveChannelMention, onChannelMentionClick, showMentionSymbol } = useContext(MarkupInteractionContext);
    const resolved = useMemo(() => resolveChannelMention === null || resolveChannelMention === void 0 ? void 0 : resolveChannelMention(mention), [mention, resolveChannelMention]);
    const handleClick = useMemo(() => (resolved ? onChannelMentionClick === null || onChannelMentionClick === void 0 ? void 0 : onChannelMentionClick(resolved) : undefined), [resolved, onChannelMentionClick]);
    if (!resolved) {
        return _jsxs(_Fragment, { children: ["#", mention] });
    }
    return (_jsx(Message.Highlight, { title: t('Mentions_channel'), tabIndex: 0, role: 'button', variant: 'link', clickable: true, onClick: handleClick, onKeyDown: (e) => {
            (e.code === 'Enter' || e.code === 'Space') && (handleClick === null || handleClick === void 0 ? void 0 : handleClick(e));
        }, children: handleChannelMention((_a = resolved.fname) !== null && _a !== void 0 ? _a : mention, showMentionSymbol) }));
};
module.exportDefault(memo(ChannelMentionElement));
//# sourceMappingURL=ChannelMentionElement.js.map