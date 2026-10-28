import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { describeSearchIndexBackendContract } from './searchIndexBackendContract';

describeSearchIndexBackendContract('createFakeSearchIndexBackend', async () => createFakeSearchIndexBackend(), { describe, it, expect });
