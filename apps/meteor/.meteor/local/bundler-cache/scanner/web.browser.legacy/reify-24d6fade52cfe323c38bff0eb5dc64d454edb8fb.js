var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var Box,Icon,Palette;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Icon:function(v){Icon=v},Palette:function(v){Palette=v}},1);

const styles = {
    ended: {
        icon: 'phone-off',
        color: Palette.text['font-hint'].toString(),
        backgroundColor: Palette.surface['surface-neutral'].toString(),
    },
    incoming: {
        icon: 'phone-in',
        color: Palette.statusColor['status-font-on-info'].toString(),
        backgroundColor: Palette.status['status-background-info'].toString(),
    },
    outgoing: {
        icon: 'phone',
        color: Palette.statusColor['status-font-on-success'].toString(),
        backgroundColor: Palette.status['status-background-success'].toString(),
    },
};
const VideoConfMessageIcon = ({ variant = 'ended' }) => (_jsx(Box, { size: 'x28', alignItems: 'center', justifyContent: 'center', display: 'flex', borderRadius: 'x4', backgroundColor: styles[variant].backgroundColor, children: _jsx(Icon, { size: 'x20', name: styles[variant].icon, color: styles[variant].color }) }));
module.exportDefault(VideoConfMessageIcon);
//# sourceMappingURL=VideoConfMessageIcon.js.map