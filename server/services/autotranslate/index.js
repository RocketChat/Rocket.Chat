/* eslint-disable import/no-duplicates */
/**
 * This file contains the exported members of the package shall be re-used.
 * @module AutoTranslate, TranslationProviderRegistry
 */

import { AutoTranslate, TranslationProviderRegistry } from './autotranslate';
import './permissions';
import './autotranslate';
import './googleTranslate.js';
import './deeplTranslate.js';
import './msTranslate.js';

export {
	AutoTranslate,
	TranslationProviderRegistry,
};
