import { SMS } from '../SMS';

SMS.registerService('twilio', async () => (await import('./twilio')).Twilio);
SMS.registerService('mobex', async () => (await import('./mobex')).Mobex);
SMS.registerService('voxtelesys', async () => (await import('./mobex')).Voxtelesys);
