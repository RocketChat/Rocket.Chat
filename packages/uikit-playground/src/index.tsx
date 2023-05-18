import '@rocket.chat/icons/dist/rocketchat.css';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';
import { Provider } from './Context';

document.body.innerHTML = '<div id="root"></div>';
const root = createRoot(document.getElementById('root')!);

root.render(
    <Provider>
      <App />
    </Provider>
);
