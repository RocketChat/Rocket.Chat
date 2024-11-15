module.export({useVideoConfControllers:()=>useVideoConfControllers},true);let useCallback,useState;module.link('react',{useCallback(v){useCallback=v},useState(v){useState=v}},0);
const useVideoConfControllers = (initialPreferences = { mic: true, cam: false }) => {
    const [controllersConfig, setControllersConfig] = useState(initialPreferences);
    const handleToggleMic = useCallback(() => setControllersConfig((prevState) => (Object.assign(Object.assign({}, prevState), { mic: !prevState.mic }))), []);
    const handleToggleCam = useCallback(() => setControllersConfig((prevState) => (Object.assign(Object.assign({}, prevState), { cam: !prevState.cam }))), []);
    return {
        controllersConfig,
        handleToggleMic,
        handleToggleCam,
    };
};
//# sourceMappingURL=useVideoConfControllers.js.map