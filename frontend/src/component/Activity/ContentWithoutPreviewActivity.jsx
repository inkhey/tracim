import React from 'react'
import PropTypes from 'prop-types'

import ContentActivityHeader from './ContentActivityHeader.jsx'

export const ContentWithoutPreviewActivity = props => {
  return (
    <ContentActivityHeader
      content={props.activity.newestMessage.fields.content}
      workspace={props.activity.newestMessage.fields.workspace}
      eventList={props.activity.eventList}
      newestMessage={props.activity.newestMessage}
      onClickCopyLink={props.onClickCopyLink}
      onEventClicked={props.onEventClicked}
      breadcrumbsList={props.breadcrumbsList}
    />
  )
}

export default ContentWithoutPreviewActivity

ContentWithoutPreviewActivity.propTypes = {
  activity: PropTypes.object.isRequired,
  onClickCopyLink: PropTypes.func.isRequired,
  breadcrumbsList: PropTypes.array,
  onEventClicked: PropTypes.func
}

ContentWithoutPreviewActivity.defaultProps = {
  breadcrumbsList: []
}
