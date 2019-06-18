var prevSelectedAppFeature = ''
var prevSelectedAppFullScreen = ''
var APP_NOT_LOADED = 'appNotLoaded'
var TIME_TO_RETRY = 500
var RETRY_TIMEOUT = 5000

function getSelectedApp (appName) {
  // FIXME - CH - 2019-06-18 - The try/catch is a temporary solution to solve the frontend, apps and appInterface.js
  // loading and execution order. If getSelectedApp return APP_NOT_LOADED, GLOBAL_renderAppFeature and GLOBAL_renderAppFullscreen
  // will retry every TIME_TO_RETRY ms for RETRY_TIMEOUT ms
  try {
    switch (appName) {
      case 'html-document':
        return (appHtmlDocument || {default: {}}).default
      case 'thread':
        return (appThread || {default: {}}).default
      case 'file':
        return (appFile || {default: {}}).default
      case 'workspace':
        return (appWorkspace || {default: {}}).default
      case 'folder':
        return (appFolderAdvanced || {default: {}}).default
      case 'admin_workspace_user':
        return (appAdminWorkspaceUser || {default: {}}).default
      case 'workspace_advanced':
        return (appWorkspaceAdvanced || {default: {}}).default
      case 'agenda':
        return (appAgenda || {default: {}}).default
      default:
        return null
    }
  } catch (e) {
    return APP_NOT_LOADED
  }
}

//@TODO make a file action.tracimCustomEvent.js that will contains all customEvent that tracim_frontend call
// => pb with that is that appInterface cant use import since it is not part of the build webpack
// use module.export and require
// doesn't work, cant resolve a file outside of the build dir

function GLOBAL_renderAppFeature (app, retryCount) {
  console.log('%cGLOBAL_renderAppFeature', 'color: #5cebeb', app)

  var selectedApp = getSelectedApp(app.config.slug)

  if (selectedApp === APP_NOT_LOADED) {
    retryCount = retryCount || 0 // INFO - CH - 2019-06-18 - old school way for default param

    console.log(app.config.slug + ' does not exists. Maybe it hasn\'t finished loading yet ? Retrying in ' + TIME_TO_RETRY + 'ms')
    var retryTime = retryCount + TIME_TO_RETRY

    if (retryTime < RETRY_TIMEOUT) {
      setTimeout(function () {GLOBAL_renderAppFeature(app, retryTime)}, TIME_TO_RETRY)
      return
    }

    console.error('Timed out waiting for app ' + app.config.slug + ' to exists')
    return
  }

  if (selectedApp.isRendered) {
    GLOBAL_dispatchEvent({type: app.config.slug + '_showApp', data: app})
  } else {
    selectedApp.renderAppFeature(app)
    selectedApp.isRendered = true
    ;(getSelectedApp(prevSelectedAppFeature) || {isRendered: null}).isRendered = false
    prevSelectedAppFeature = selectedApp.name
  }
}

function GLOBAL_renderAppFullscreen (app, retryCount) {
  console.log('%cGLOBAL_renderAppFullscreen', 'color: #5cebeb', app)

  var selectedApp = getSelectedApp(app.config.slug)

  if (selectedApp === APP_NOT_LOADED) {
    retryCount = retryCount || 0 // INFO - CH - 2019-06-18 - old school way for default param

    console.log(app.config.slug + ' does not exists. Maybe it hasn\'t finished loading yet ? Retrying in ' + TIME_TO_RETRY + 'ms')

    var retryTime = retryCount + TIME_TO_RETRY

    if (retryTime < RETRY_TIMEOUT) {
      setTimeout(function () {GLOBAL_renderAppFullscreen(app, retryTime)}, TIME_TO_RETRY)
      return
    }

    console.error('Timed out waiting for app ' + app.config.slug + ' to exists')
    return
  }

  if (selectedApp.isRendered) {
    GLOBAL_dispatchEvent({type: app.config.slug + '_showApp', data: app})
  } else {
    selectedApp.renderAppFullscreen(app)
    selectedApp.isRendered = true
    ;(getSelectedApp(prevSelectedAppFullScreen) || {isRendered: null}).isRendered = false
    prevSelectedAppFullScreen = selectedApp.name
  }
}

function GLOBAL_renderAppPopupCreation (app) {
  console.log('%cGLOBAL_renderAppPopupCreation', 'color: #5cebeb', app)

  var selectedApp = getSelectedApp(app.config.slug)

  if (!selectedApp) {
    console.log('Error in GLOBAL_renderAppPopupCreation, selectedApp is undefined', app)
    return
  }

  getSelectedApp(app.config.slug).renderAppPopupCreation(app)
}

function GLOBAL_dispatchEvent (event) {
  var type = event.type
  var data = event.data
  console.log('%cGLOBAL_dispatchEvent', 'color: #fff', type, data)

  var customEvent = new CustomEvent('appCustomEvent', {detail: {type, data}})
  document.dispatchEvent(customEvent)
}

function GLOBAL_eventReducer (event) {
  var type = event.detail.type
  var data = event.detail.data

  switch (type) {
    case 'hide_popupCreateContent':
    case 'hide_popupCreateWorkspace':
      console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)
      getSelectedApp(data.name).unmountApp('popupCreateContentContainer')
      break
    case 'unmount_app':
      console.log('%cGLOBAL_eventReducer Custom Event', 'color: #28a745', type, data)

      var selectedApp

      if (prevSelectedAppFeature !== '') {
        selectedApp = getSelectedApp(prevSelectedAppFeature)
        selectedApp.unmountApp('appFeatureContainer')
        selectedApp.unmountApp('popupCreateContentContainer')
        selectedApp.isRendered = false
        prevSelectedAppFeature = ''
      }

      if (prevSelectedAppFullScreen !== '') {
        selectedApp = getSelectedApp(prevSelectedAppFullScreen)
        selectedApp.unmountApp('appFullscreenContainer')
        selectedApp.isRendered = false
        prevSelectedAppFullScreen = ''
      }
      break
  }
}

document.addEventListener('appCustomEvent', GLOBAL_eventReducer)
