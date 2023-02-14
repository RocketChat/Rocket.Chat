import { addAppsSettings, watchAppsSettingsChanges } from './settings';
import './communication/startup';
import './api';

addAppsSettings();
watchAppsSettingsChanges();
