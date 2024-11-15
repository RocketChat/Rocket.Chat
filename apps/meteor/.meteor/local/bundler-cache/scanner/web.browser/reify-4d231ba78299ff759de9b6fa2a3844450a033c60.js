let _jsxs;module.link("react/jsx-runtime",{jsxs(v){_jsxs=v}},0);let useEffect,useMemo,useState;module.link('react',{useEffect(v){useEffect=v},useMemo(v){useMemo=v},useState(v){useState=v}},1);let setPreciseInterval;module.link('../../utils/setPreciseInterval',{setPreciseInterval(v){setPreciseInterval=v}},2);


const VoipTimer = ({ startAt = new Date() }) => {
    const [start] = useState(startAt.getTime());
    const [ellapsedTime, setEllapsedTime] = useState(0);
    useEffect(() => {
        return setPreciseInterval(() => {
            setEllapsedTime(Date.now() - start);
        }, 1000);
    });
    const [hours, minutes, seconds] = useMemo(() => {
        const totalSeconds = Math.floor(ellapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return [hours.toString().padStart(2, '0'), minutes.toString().padStart(2, '0'), seconds.toString().padStart(2, '0')];
    }, [ellapsedTime]);
    return (_jsxs("time", { "aria-hidden": true, children: [hours !== '00' ? `${hours}:` : '', minutes, ":", seconds] }));
};
module.exportDefault(VoipTimer);
//# sourceMappingURL=VoipTimer.js.map