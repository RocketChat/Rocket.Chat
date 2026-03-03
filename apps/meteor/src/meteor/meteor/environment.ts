// src/core/environment.ts

// Assuming a standard modern bundler injection (Vite, Webpack, etc.)
// @ts-expect-error
const NODE_ENV = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';

export const Meteor = {
  isProduction: NODE_ENV === "production",
  isDevelopment: NODE_ENV !== "production",
  
  // Demeteorized frontend is ALWAYS client, NEVER server or cordova
  isClient: true,
  isServer: false,
  isCordova: false,
  
  // Modern browser environment is assumed
  isModern: true,
  
  // Test environments
  isTest: NODE_ENV === "test",
  isAppTest: false,
  isPackageTest: false,
  
  // Dummy settings to maintain API surface
  settings: {
    public: {}
  },
  
  release: "demeteorized"
};