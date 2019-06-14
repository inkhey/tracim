import { defaultDebug } from 'tracim_frontend_lib'

export const debug = {
  config: {
    ...defaultDebug.config,
    slug: 'folder',
    faIcon: 'folder-o',
    hexcolor: '#414548',
    creationLabel: 'Create a folder',
    label: 'Folder'
  },
  content: {
    ...defaultDebug.content,
    content_id: 25,
    content_type: 'folder',
    workspace_id: 5
  },
  loggedUser: {
    ...defaultDebug.loggedUser
  }
}
