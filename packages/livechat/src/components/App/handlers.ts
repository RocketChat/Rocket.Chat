import { route } from 'preact-router';

import { setInitCookies } from '../helpers';
import { parentCall } from '../../lib/parentCall';
import Triggers from '../../lib/triggers';
import { store } from '../../store';
import { visibility } from '../helpers';

type HandleRouteProps = {
    config: {
        settings: {
            registrationForm: boolean,
            nameFieldRegistrationForm: string,
            emailFieldRegistrationForm: string,
            forceAcceptDataProcessingConsent: boolean,
        },
        online: boolean,
        departments: {showOnRegistration: unknown}[],
    },
    gdpr: {
        accepted: boolean,
    },
    triggered: boolean,
    user: {
        token: string,
    },
};

export const handleRoute = async ({
    config: {
        settings: {
            registrationForm,
            nameFieldRegistrationForm,
            emailFieldRegistrationForm,
            forceAcceptDataProcessingConsent: gdprRequired,
        },
        online,
        departments = [],
    },
    gdpr: {
        accepted: gdprAccepted,
    },
    triggered,
    user,
}: HandleRouteProps) => {
    setTimeout(() => {
        setInitCookies();

        if (gdprRequired && !gdprAccepted) {
            return route('/gdpr');
        }

        if (!online) {
            parentCall('callback', 'no-agent-online');
            return route('/leave-message');
        }

        const showDepartment = departments.filter((dept: {showOnRegistration: unknown}) => dept.showOnRegistration).length > 0;

        const showRegistrationForm = (
            registrationForm
                && (nameFieldRegistrationForm || emailFieldRegistrationForm || showDepartment)
        )
            && !triggered
            && !(user && user.token);

        if (showRegistrationForm) {
            return route('/register');
        }
    }, 100);
};

export const handleTriggers = ({ online, enabled } : {online: boolean, enabled: boolean}) => {
    if (online && enabled) {
        Triggers.init();
    }

    Triggers.processTriggers();
}

export const handleEnableNotifications = ({ dispatch, sound = {} } :
    {
        dispatch: (partialState: unknown) => void;
        sound: { src: string; enabled: boolean; play: boolean; } | {}
    }
) => {
    dispatch({ sound: { ...sound, enabled: true } });
};

export const handleDisableNotifications = ({ dispatch, sound = {} } :
    {
        dispatch: (partialState: unknown) => void;
        sound: { src: string; enabled: boolean; play: boolean; } | {}
    }
) => {
    dispatch({ sound: { ...sound, enabled: false } });
};

export const handleMinimize = (dispatch: (partialState: unknown) => void) => {
    parentCall('minimizeWindow');

    dispatch({ minimized: true });
};

export const handleRestore = ({ dispatch, undocked } :
    {
        dispatch: (partialState: unknown) => void;
        undocked: boolean;
    }
) => {
    parentCall('restoreWindow');

    const dispatchRestore = () => dispatch({ minimized: false, undocked: false });
    const dispatchEvent = () => {
        dispatchRestore();
        store.off('storageSynced', dispatchEvent);
    };

    if (undocked) {
        store.on('storageSynced', dispatchEvent);
    } else {
        dispatchRestore();
    }

    Triggers.callbacks.emit('chat-opened-by-visitor');
};

export const handleOpenWindow = (dispatch: (partialState: unknown) => void) => {
    parentCall('openPopout');

    dispatch({ undocked: true, minimized: false });
};

export const handleDismissAlert = ({ dispatch, alerts, id } :
    {
        dispatch: (partialState: unknown) => void;
        alerts: {id: String}[];
        id: String;
    }
) => {
    dispatch({ alerts: alerts.filter((alert: {id: String}) => alert.id !== id) });
};

export const handleVisibilityChange = (dispatch: (partialState: unknown) => void) => {
    return () => dispatch({ visible: !visibility.hidden });
};
