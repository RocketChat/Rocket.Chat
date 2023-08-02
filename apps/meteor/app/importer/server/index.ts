import { Base } from './classes/ImporterBase';
import { ImporterWebsocket } from './classes/ImporterWebsocket';
import { Selection } from './classes/ImporterSelection';
import { SelectionChannel } from './classes/ImporterSelectionChannel';
import { SelectionUser } from './classes/ImporterSelectionUser';
import { ProgressStep } from '../lib/ImporterProgressStep';
import { Importers } from '../lib/Importers';
import { ImporterInfo } from '../lib/ImporterInfo';
import './methods';
import './startup/setImportsToInvalid';
import './startup/store';

// Adding a link to the base class using the 'api' key. This won't be needed in the new importer structure implemented on the parallel PR
Importers.add(new ImporterInfo('api', 'API', ''), Base);

export { Base, Importers, ImporterWebsocket, ProgressStep, Selection, SelectionChannel, SelectionUser };
