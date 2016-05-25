import Immutable from 'immutable';
import React from 'react';
import ReactDOM from 'react-dom';
import { LOCATION_CHANGE, syncHistoryWithStore } from 'react-router-redux';
import { Provider } from 'react-redux';
import { Router, Route, browserHistory } from 'react-router';
import { combineReducers } from 'redux-immutable';
import { compose, createStore } from 'redux';
import { createDevTools, persistState } from 'redux-devtools';
import ChartMonitor from 'redux-devtools-chart-monitor';
import DockMonitor from 'redux-devtools-dock-monitor';
import LogMonitor from 'redux-devtools-log-monitor';
import SliderMonitor from 'redux-slider-monitor';

const IS_PROD = process.env.NODE_ENV !== 'development';
const NOOP = () => null;

let DevTools = IS_PROD ? NOOP : createDevTools(
  <DockMonitor
    toggleVisibilityKey="ctrl-h"
    changePositionKey="ctrl-q"
    changeMonitorKey="ctrl-m"
    defaultVisible="false">
      <LogMonitor />
      <SliderMonitor />
      <ChartMonitor />
  </DockMonitor>
);

let devtoolsStore = IS_PROD ? undefined : compose(
  window.devToolsExtension ? window.devToolsExtension() : DevTools.instrument(),
  persistState(location.href.match(/[?&]debug_session=([^&]+)\b/))
);

export default ({ reducers = {}, initialState = {}, routes = [], Layout = NOOP }) => {
  const frozen = Immutable.fromJS(initialState);
  const routing = (state = frozen, action) => {
    return action.type === LOCATION_CHANGE ?
      state.merge({ locationBeforeTransitions: action.payload }) :
      state;
  };

  const store = createStore(
    combineReducers({ ...reducers, routing }),
    frozen,
    devtoolsStore
  );

  const history = syncHistoryWithStore(browserHistory, store, {
    selectLocationState: state => state.has('routing') ? state.get('routing').toJS() : null
  });

  const LayoutWrapper = (props) => (
    <div id="wrapper">
      <Layout {...props} />
      <DevTools />
    </div>
  );

  return {
    store,
    history,
    render(rootElement = document.getElementById('root')) {
      ReactDOM.render(
        <Provider store={store}>
          <Router history={history}>
            <Route component={LayoutWrapper}>
              {routes.map(route => <Route key={route.path} path={route.path} component={route.component} />)}
            </Route>
          </Router>
        </Provider>,
        rootElement
      );
    }
  };
};