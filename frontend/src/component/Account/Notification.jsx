import React from 'react'
import { translate } from 'react-i18next'
import { BtnSwitch } from 'tracim_frontend_lib'
import { ROLE } from '../../helper.js'

export const Notification = props =>
  <div className='account__userpreference__setting__notification'>
    <div className='notification__sectiontitle subTitle ml-2 ml-sm-0'>
      {props.t('Workspace and notifications')}
    </div>

    <div className='notification__text ml-2 ml-sm-0' />

    <div className='notification__table'>
      <table className='table'>
        <thead>
          <tr>
            <th>{props.t('Workspace')}</th>
            <th>{props.t('Role')}</th>
            <th>{props.t('Notification')}</th>
          </tr>
        </thead>

        <tbody>
          { props.workspaceList.map(ws => {
            const mySelf = ws.memberList.find(u => u.user_id === props.idMyself)
            const myRole = ROLE.find(r => r.slug === mySelf.role)
            return (
              <tr key={ws.id}>
                <td>
                  <div className='notification__table__wksname'>
                    {ws.label}
                  </div>
                </td>

                <td>
                  <div className='notification__table__role'>
                    <div className='notification__table__role__icon'>
                      <i className={`fa fa-fw fa-${myRole.faIcon}`} style={{color: ws.hexcolor}} />
                    </div>
                    <div className='notification__table__role__text d-none d-sm-flex'>
                      {myRole.label}
                    </div>
                  </div>
                </td>

                <td>
                  <BtnSwitch
                    checked={mySelf.do_notify}
                    onChange={() => props.onChangeSubscriptionNotif(ws.id, !mySelf.do_notify)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>

export default translate()(Notification)
