import { settings } from '../../app/settings/server';
import { Presence } from '../sdk';

// maybe this setting should disable the listener to 'presence.status' event on listerners.module.ts
settings.watch('Troubleshoot_Disable_Presence_Broadcast', (value) => Presence.toggleBroadcast(!value));
