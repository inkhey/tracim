import {
  FETCH_CONFIG,
  PAGE,
  unLoggedAllowedPageList
} from './helper.js'
import i18n from './i18n.js'
import * as Cookies from 'js-cookie'
import {
  USER_LOGIN,
  USER_LOGOUT,
  USER_REQUEST_PASSWORD,
  USER_CONNECTED,
  setRedirectLogin,
  setUserDisconnected,
  USER_KNOWN_MEMBER_LIST,
  USER_NAME,
  USER_EMAIL,
  USER_PASSWORD,
  USER_LANG,
  WORKSPACE,
  WORKSPACE_LIST,
  WORKSPACE_DETAIL,
  WORKSPACE_MEMBER_LIST,
  WORKSPACE_MEMBER_ADD,
  WORKSPACE_MEMBER_REMOVE,
  FOLDER,
  setFolderData,
  CONFIG,
  APP_LIST,
  CONTENT_TYPE_LIST,
  WORKSPACE_CONTENT_ARCHIVED,
  WORKSPACE_CONTENT_DELETED,
  WORKSPACE_RECENT_ACTIVITY,
  WORKSPACE_READ_STATUS,
  USER_WORKSPACE_DO_NOTIFY,
  USER,
  USER_WORKSPACE_LIST,
  newFlashMessage
} from './action-creator.sync.js'
import { history } from './index.js'

/*
 * fetchWrapper(obj)
 *
 * Params:
 *   An Object with the following attributes :
 *     url - string - url of the end point to call
 *     param - object - param to send with fetch call (eg. header)
 *       param.method - string - REQUIRED - method of the http call
 *     actionName - string - name of the action to dispatch with 'PENDING' and 'SUCCESS' respectively before and after the http request
 *     dispatch - func - redux dispatcher function
 *
 * Returns:
 *   An object Response generated by whatwg-fetch with a new property 'json' containing the data received or informations in case of failure
 *
 * This function create a http async request using whatwg-fetch while dispatching a PENDING and a SUCCESS redux action.
 * It also adds, to the Response of the fetch request, the json value so that the redux action have access to the status and the data
 */
// Côme - 2018/08/02 - fetchWrapper should come from tracim_lib so that all apps uses the same
// 08/09/2018 - maybe not since this fetchWrapper also dispatch redux actions whether it succeed or failed
const fetchWrapper = async ({url, param, actionName, dispatch, debug = false}) => {
  dispatch({type: `${param.method}/${actionName}/PENDING`})

  try {
    const fetchResult = await fetch(url, param)
    fetchResult.json = await (async () => {
      switch (fetchResult.status) {
        case 200:
        case 304:
        case 400: // 400 should return the body in json to handle the backend error code in it
          return fetchResult.json()
        case 204:
          return ''
        case 401:
          if (!unLoggedAllowedPageList.includes(document.location.pathname)) {
            dispatch(setRedirectLogin(document.location.pathname + document.location.search))
            dispatch(setUserDisconnected())
            history.push(`${PAGE.LOGIN}${Cookies.get('lastConnection') ? '?dc=1' : ''}`)
          }
          return ''
        case 403:
        case 404:
        case 409:
          return ''
        case 500:
        case 501:
        case 502:
        case 503:
        case 504:
          dispatch(newFlashMessage(i18n.t('Unexpected error, please inform an administrator'), 'danger'))
          break
      }
    })()
    if (debug) console.log(`fetch ${param.method}/${actionName} result: `, fetchResult)

    // if ([200, 204, 304].includes(fetchResult.status)) dispatch({type: `${param.method}/${actionName}/SUCCESS`, data: fetchResult.json})
    // else if ([400, 404, 500].includes(fetchResult.status)) dispatch({type: `${param.method}/${actionName}/FAILED`, data: fetchResult.json})
    switch (fetchResult.status) {
      case 200:
      case 204:
      case 304:
        dispatch({type: `${param.method}/${actionName}/SUCCESS`, data: fetchResult.json})
        break
      case 400:
      case 401:
      case 403:
      case 404:
      case 500:
        dispatch({type: `${param.method}/${actionName}/FAILED`, data: fetchResult.json})
        break
    }
    return fetchResult
  } catch (e) {
    if (e instanceof TypeError) {
      dispatch(newFlashMessage(i18n.t('Server unreachable'), 'danger'))
      console.error(e)
    }
    return {status: 'failedToFetch'} // Côme - 2018/10/08 - this status is unused, the point is only to return an object with a status attribute
  }
}

export const postUserLogin = (login, password, rememberMe) => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/login`,
    param: {
      credentials: 'include',
      headers: {...FETCH_CONFIG.headers},
      method: 'POST',
      body: JSON.stringify({
        email: login,
        password: password
        // remember_me: rememberMe
      })
    },
    actionName: USER_LOGIN,
    dispatch
  })
}

export const postForgotPassword = email => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/password/reset/request`,
    param: {
      credentials: 'include',
      headers: {...FETCH_CONFIG.headers},
      method: 'POST',
      body: JSON.stringify({
        email: email
      })
    },
    actionName: USER_REQUEST_PASSWORD,
    dispatch
  })
}

export const postResetPassword = (newPassword, newPassword2, email, token) => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/password/reset/modify`,
    param: {
      credentials: 'include',
      headers: {...FETCH_CONFIG.headers},
      method: 'POST',
      body: JSON.stringify({
        email: email,
        new_password: newPassword,
        new_password2: newPassword2,
        reset_password_token: token
      })
    },
    actionName: USER_REQUEST_PASSWORD,
    dispatch
  })
}

export const postUserLogout = () => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/logout`,
    param: {
      credentials: 'include',
      headers: {...FETCH_CONFIG.headers},
      method: 'POST'
    },
    actionName: USER_LOGOUT,
    dispatch
  })
}

export const getUser = idUser => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${idUser}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER,
    dispatch
  })
}

export const getUserWorkspaceList = idUser => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${idUser}/workspaces`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER_WORKSPACE_LIST,
    dispatch
  })
}

export const getUserIsConnected = () => async dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/auth/whoami`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER_CONNECTED,
    dispatch
  })
}

export const getMyselfKnownMember = userNameToSearch => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/known_members?acp=${userNameToSearch}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: USER_KNOWN_MEMBER_LIST,
    dispatch
  })
}

export const putMyselfName = (user, newName) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        public_name: newName,
        timezone: user.timezone,
        lang: user.lang
      })
    },
    actionName: USER_NAME,
    dispatch
  })
}

export const putUserName = (user, newName) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.user_id}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        public_name: newName,
        timezone: user.timezone,
        lang: user.lang
      })
    },
    actionName: USER_NAME,
    dispatch
  })
}

export const putMyselfEmail = (newEmail, checkPassword) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/email`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        email: newEmail,
        loggedin_user_password: checkPassword
      })
    },
    actionName: USER_EMAIL,
    dispatch
  })
}

export const putUserEmail = (user, newEmail, checkPassword) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.user_id}/email`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        email: newEmail,
        loggedin_user_password: checkPassword
      })
    },
    actionName: USER_EMAIL,
    dispatch
  })
}

export const putMyselfPassword = (oldPassword, newPassword, newPassword2) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/password`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        loggedin_user_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2
      })
    },
    actionName: USER_PASSWORD,
    dispatch
  })
}

export const putUserPassword = (user, oldPassword, newPassword, newPassword2) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.user_id}/password`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        loggedin_user_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2
      })
    },
    actionName: USER_PASSWORD,
    dispatch
  })
}

export const putUserLang = (user, newLang) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.user_id}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT',
      body: JSON.stringify({
        public_name: user.public_name,
        timezone: user.timezone,
        lang: newLang
      })
    },
    actionName: USER_LANG,
    dispatch
  })
}

export const putMyselfWorkspaceRead = idWorkspace => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${idWorkspace}/read`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: USER_KNOWN_MEMBER_LIST,
    dispatch
  })
}

export const putMyselfWorkspaceDoNotify = (idWorkspace, doNotify) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${idWorkspace}/notifications/${doNotify ? 'activate' : 'deactivate'}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: USER_WORKSPACE_DO_NOTIFY,
    dispatch
  })
}

export const putUserWorkspaceDoNotify = (user, idWorkspace, doNotify) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/${user.user_id}/workspaces/${idWorkspace}/notifications/${doNotify ? 'activate' : 'deactivate'}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: USER_WORKSPACE_DO_NOTIFY,
    dispatch
  })
}

export const getMyselfWorkspaceList = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_LIST,
    dispatch
  })
}

export const getWorkspaceDetail = (user, idWorkspace) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_DETAIL,
    dispatch
  })
}

export const getWorkspaceMemberList = idWorkspace => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/members`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_MEMBER_LIST,
    dispatch
  })
}

export const getWorkspaceContentList = (user, idWorkspace, idParent) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/contents?parent_id=${idParent}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE,
    dispatch
  })
}

export const getMyselfWorkspaceRecentActivityList = (idWorkspace, beforeId = null) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${idWorkspace}/contents/recently_active?limit=10${beforeId ? `&before_content_id=${beforeId}` : ''}`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_RECENT_ACTIVITY,
    dispatch
  })
}

export const getMyselfWorkspaceReadStatusList = idWorkspace => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/users/me/workspaces/${idWorkspace}/contents/read_status`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: WORKSPACE_READ_STATUS,
    dispatch
  })
}

export const postWorkspaceMember = (user, idWorkspace, newMember) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/members`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'POST',
      body: JSON.stringify({
        user_id: newMember.id || null,
        user_email: newMember.email || null,
        user_public_name: newMember.publicName || null,
        role: newMember.role
      })
    },
    actionName: WORKSPACE_MEMBER_ADD,
    dispatch
  })
}

export const deleteWorkspaceMember = (user, idWorkspace, idMember) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/members/${idMember}`,
    param: {
      credentials: 'include',
      headers: {...FETCH_CONFIG.headers},
      method: 'DELETE'
    },
    actionName: WORKSPACE_MEMBER_REMOVE,
    dispatch
  })
}

export const getFolderContent = (idWorkspace, idFolder) => async dispatch => {
  const fetchGetFolderContent = await fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/contents/?parent_id=${idFolder}`,
    param: {
      credentials: 'include',
      headers: {...FETCH_CONFIG.headers},
      method: 'GET'
    },
    actionName: `${WORKSPACE}/${FOLDER}`,
    dispatch
  })
  if (fetchGetFolderContent.status === 200) dispatch(setFolderData(idFolder, fetchGetFolderContent.json))
}

export const getConfig = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/config`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: CONFIG,
    dispatch
  })
}

export const getAppList = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/applications`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: APP_LIST,
    dispatch
  })
}

export const getContentTypeList = () => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/system/content_types`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'GET'
    },
    actionName: CONTENT_TYPE_LIST,
    dispatch
  })
}

export const putWorkspaceContentArchived = (user, idWorkspace, idContent) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/archived`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: WORKSPACE_CONTENT_ARCHIVED,
    dispatch
  })
}

export const putWorkspaceContentDeleted = (user, idWorkspace, idContent) => dispatch => {
  return fetchWrapper({
    url: `${FETCH_CONFIG.apiUrl}/workspaces/${idWorkspace}/contents/${idContent}/trashed`,
    param: {
      credentials: 'include',
      headers: {
        ...FETCH_CONFIG.headers
      },
      method: 'PUT'
    },
    actionName: WORKSPACE_CONTENT_DELETED,
    dispatch
  })
}
