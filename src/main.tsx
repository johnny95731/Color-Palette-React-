import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import 'normalize.css';
import './index.module.scss';

import App from './App.tsx';
import store from './features/index.ts';

const root = ReactDOM.createRoot(
    document.getElementById('root') as Element,
);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
