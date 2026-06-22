import * as path from 'path';

export const appImplementsIPreFileUpload = path.resolve(__dirname, './file-upload-test_0.0.1.zip');

export const appAPIParameterTest = path.resolve(__dirname, './api-parameter-test_0.0.1.zip');

export const appCausingNestedRequests = path.resolve(__dirname, './nested-requests_0.0.1.zip');

export const appUiKitRoomTest = path.resolve(__dirname, './uikit-room-test_0.0.1.zip');

export const appUpdateStatusTest = path.resolve(__dirname, './update-status-test_0.0.1.zip');

export const appUpdateTest = path.resolve(__dirname, './app-update-test_0.0.1.zip');

// Same app id as appUpdateTest, but its `onEnable()` throws so the update applies yet the app ends up disabled.
export const appUpdateTestFaulty = path.resolve(__dirname, './app-update-test-faulty_0.0.2.zip');

// Same app id as appUpdateTest, but the package is missing its main class file, so the update fails to apply.
export const appUpdateTestBroken = path.resolve(__dirname, './app-update-test-broken_0.0.3.zip');

export const appExternalIdTest = path.resolve(__dirname, './external-id-test_0.0.1.zip');

export const messageReactionTest = path.resolve(__dirname, './message-updater-test_0.0.1.zip');

export const appPresenceStateTest = path.resolve(__dirname, './presence-state-test_0.0.1.zip');
