module.export({useVoipSounds:()=>useVoipSounds},true);let useCustomSound,useUserPreference;module.link('@rocket.chat/ui-contexts',{useCustomSound(v){useCustomSound=v},useUserPreference(v){useUserPreference=v}},0);let useMemo;module.link('react',{useMemo(v){useMemo=v}},1);

const useVoipSounds = () => {
    const { play, pause } = useCustomSound();
    const audioVolume = useUserPreference('notificationsSoundVolume', 100) || 100;
    return useMemo(() => ({
        play: (soundId, loop = true) => {
            play(soundId, {
                volume: Number((audioVolume / 100).toPrecision(2)),
                loop,
            });
        },
        stop: (soundId) => pause(soundId),
        stopAll: () => {
            pause('telephone');
            pause('outbound-call-ringing');
        },
    }), [play, pause, audioVolume]);
};
//# sourceMappingURL=useVoipSounds.js.map