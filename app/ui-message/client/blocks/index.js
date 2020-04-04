import { createTemplateForComponent } from '../../../../client/reactAdapters';
import './styles.css';
import './Blocks.js';
import './TextBlock';
import './ButtonElement.html';

createTemplateForComponent('ModalBlock', () => import('./ModalBlock'));
