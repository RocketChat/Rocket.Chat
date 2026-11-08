import './shims/process';
// Meteor bundles the global stylesheet eagerly; Vite only sees what is imported.
import '../client/styles/main.css';
import '../client/main';
