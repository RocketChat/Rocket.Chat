import { onLicense } from '../../license/server';
import { overwriteClassOnLicense } from '../../license/server/license';
import { SpotlightEnterprise } from './EESpotlight';
import { Spotlight } from '../../../../server/lib/spotlight';

onLicense('teams-mention', () => {
    // Override spotlight with EE version
    overwriteClassOnLicense('teams-mention', Spotlight, SpotlightEnterprise);
});
