import {getKnowledgeAdapter as getAdapter} from './server/lib/KnowledgeAdapterProvider';

export const name = 'assistify:ai';

// Knowledge Adapter is requested in the help-request-package - so export it here.
// Else, the exported function is invisible to other packages.
// Do not use api.export in package.js - this is only legacy
export function getKnowledgeAdapter() {
	return getAdapter();
}

