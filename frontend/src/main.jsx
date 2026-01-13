import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'; // Importación clave
import App from './App.jsx';
import { Provider } from "react-redux";
import store from '../redux/store.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider value={defaultSystem}>
        <App />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>
);