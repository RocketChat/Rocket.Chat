let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let Tag;module.link('@rocket.chat/fuselage',{Tag(v){Tag=v}},1);let format;module.link('date-fns',{format(v){format=v}},2);let useContext,useEffect,useState;module.link('react',{useContext(v){useContext=v},useEffect(v){useEffect=v},useState(v){useState=v}},3);let ErrorBoundary;module.link('react-error-boundary',{ErrorBoundary(v){ErrorBoundary=v}},4);let timeAgo;module.link('./timeago',{timeAgo(v){timeAgo=v}},5);let MarkupInteractionContext;module.link('../../MarkupInteractionContext',{MarkupInteractionContext(v){MarkupInteractionContext=v}},6);
/* eslint-disable @typescript-eslint/explicit-function-return-type */






const Timestamp = ({ format, value }) => {
    switch (format) {
        case 't': // Short time format
            return _jsx(ShortTime, { value: value });
        case 'T': // Long time format
            return _jsx(LongTime, { value: value });
        case 'd': // Short date format
            return _jsx(ShortDate, { value: value });
        case 'D': // Long date format
            return _jsx(LongDate, { value: value });
        case 'f': // Full date and time format
            return _jsx(FullDate, { value: value });
        case 'F': // Full date and time (long) format
            return _jsx(FullDateLong, { value: value });
        case 'R': // Relative time format
            return _jsx(RelativeTime, { value: value });
        default:
            return _jsxs("time", { dateTime: value.toISOString(), children: [" ", JSON.stringify(value.getTime())] });
    }
};
// eslint-disable-next-line react/no-multi-comp
const TimestampWrapper = ({ children }) => {
    const { enableTimestamp } = useContext(MarkupInteractionContext);
    if (!enableTimestamp) {
        return _jsx(_Fragment, { children: `<t:${children.value.timestamp}:${children.value.format}>` });
    }
    return (_jsx(ErrorBoundary, { fallback: _jsx(_Fragment, { children: new Date(parseInt(children.value.timestamp) * 1000).toUTCString() }), children: _jsx(Timestamp, { format: children.value.format, value: new Date(parseInt(children.value.timestamp) * 1000) }) }));
};
// eslint-disable-next-line react/no-multi-comp
const ShortTime = ({ value }) => _jsx(Time, { value: format(value, 'p'), dateTime: value.toISOString() });
// eslint-disable-next-line react/no-multi-comp
const LongTime = ({ value }) => _jsx(Time, { value: format(value, 'pp'), dateTime: value.toISOString() });
// eslint-disable-next-line react/no-multi-comp
const ShortDate = ({ value }) => _jsx(Time, { value: format(value, 'P'), dateTime: value.toISOString() });
// eslint-disable-next-line react/no-multi-comp
const LongDate = ({ value }) => _jsx(Time, { value: format(value, 'Pp'), dateTime: value.toISOString() });
// eslint-disable-next-line react/no-multi-comp
const FullDate = ({ value }) => _jsx(Time, { value: format(value, 'PPPppp'), dateTime: value.toISOString() });
// eslint-disable-next-line react/no-multi-comp
const FullDateLong = ({ value }) => _jsx(Time, { value: format(value, 'PPPPpppp'), dateTime: value.toISOString() });
// eslint-disable-next-line react/no-multi-comp
const Time = ({ value, dateTime }) => (_jsx("time", { title: new Date(dateTime).toLocaleString(), dateTime: dateTime, style: {
        display: 'inline-block',
    }, children: _jsx(Tag, { children: value }) }));
// eslint-disable-next-line react/no-multi-comp
const RelativeTime = ({ value }) => {
    const time = value.getTime();
    const { language } = useContext(MarkupInteractionContext);
    const [text, setTime] = useState(() => timeAgo(time, language !== null && language !== void 0 ? language : 'en'));
    const [timeToRefresh, setTimeToRefresh] = useState(() => getTimeToRefresh(time));
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(timeAgo(value.getTime(), 'en'));
            setTimeToRefresh(getTimeToRefresh(time));
        }, timeToRefresh);
        return () => clearInterval(interval);
    }, [time, timeToRefresh, value]);
    return _jsx(Time, { value: text, dateTime: value.toISOString() });
};
const getTimeToRefresh = (time) => {
    const timeToRefresh = time - Date.now();
    // less than 1 minute
    if (timeToRefresh < 60000) {
        return 1000;
    }
    // if the difference is in the minutes range, we should refresh the time in 1 minute / 2
    if (timeToRefresh < 3600000) {
        return 60000 / 2;
    }
    // if the difference is in the hours range, we should refresh the time in 5 minutes
    if (timeToRefresh < 86400000) {
        return 60000 * 5;
    }
    // refresh the time in 1 hour
    return 3600000;
};
module.exportDefault(TimestampWrapper);
//# sourceMappingURL=index.js.map