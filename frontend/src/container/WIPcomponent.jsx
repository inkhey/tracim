import React from 'react'
import { connect } from 'react-redux'

export class WIPcomponent extends React.Component {
  render () {
    // const MyComponent = {
    //   Home
    // }

    // this.props.dispatch(newFlashMessage('TEST', 'info', 0))

    // const ComponentToDisplay = MyComponent[this.props.match.params.cp]

    return (
      <div />
    )
  }
}

const mapStateToProps = () => ({})
export default connect(mapStateToProps)(WIPcomponent)
