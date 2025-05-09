import { MockedAppRootBuilder } from './MockedAppRootBuilder';

export const mockAppRoot = () => new MockedAppRootBuilder();

export * from './MockedRouterContext';
export * from './MockedAuthorizationContext';
export * from './MockedModalContext';
export * from './MockedServerContext';
export * from './MockedSettingsContext';
export * from './MockedUserContext';
export * from './MockedDeviceContext';
