module.export({useThemeMode:function(){return useThemeMode}},true);var useDarkMode;module.link('@rocket.chat/fuselage-hooks',{useDarkMode:function(v){useDarkMode=v}},0);var useEndpoint,useUserPreference;module.link('@rocket.chat/ui-contexts',{useEndpoint:function(v){useEndpoint=v},useUserPreference:function(v){useUserPreference=v}},1);var useCallback,useState;module.link('react',{useCallback:function(v){useCallback=v},useState:function(v){useState=v}},2);


/**
 * Returns the current option set by the user, the theme mode resolved given the user configuration and OS (if applies) and a function to set it.
 * @param defaultThemeMode The default theme mode to use if the user has not set any.
 * @returns [currentThemeMode, setThemeMode, resolvedThemeMode]
 */
const useThemeMode = () => {
    const themeMode = useUserPreference('themeAppearence') || 'auto';
    const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
    const [updaters] = useState(() => ({
        'light': () => saveUserPreferences({ data: { themeAppearence: 'light' } }),
        'dark': () => saveUserPreferences({ data: { themeAppearence: 'dark' } }),
        'auto': () => saveUserPreferences({ data: { themeAppearence: 'auto' } }),
        'high-contrast': () => saveUserPreferences({ data: { themeAppearence: 'high-contrast' } }),
    }));
    const setTheme = useCallback((value) => updaters[value], [updaters]);
    const useTheme = () => {
        if (useDarkMode(themeMode === 'auto' ? undefined : themeMode === 'dark')) {
            return 'dark';
        }
        if (themeMode === 'high-contrast') {
            return 'high-contrast';
        }
        return 'light';
    };
    return [themeMode, setTheme, useTheme()];
};
//# sourceMappingURL=useThemeMode.js.map