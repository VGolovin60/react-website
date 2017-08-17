import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

require('jquery');

ReactDOM.render(<App />, document.getElementById('root'));
$("#popupAddEvent").hide();
registerServiceWorker();
