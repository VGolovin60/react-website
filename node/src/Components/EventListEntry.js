import React, { Component } from 'react';

class EventListEntry extends Component {
  handleDeleteEvent() {
    this.props.onDelete(this.props.eventID);
  }

  handleSelectEvent(e) {
    this.props.onSelected(this.props.eventID, e.target.checked)
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-1 event-selected">
          <input type="checkbox" checked={this.props.isSelected} onChange={this.handleSelectEvent.bind(this)}/>
        </div>
        <div className="col-sm-11 row event-row">
          <div className="col-sm-10">
            <div className="col-sm-2">
              <p className="lead">
                  {Math.floor(this.props.eventTime / 60)}:
                  {((this.props.eventTime % 60) > 10 ? 
                   this.props.eventTime % 60 :
                   '0' + this.props.eventTime % 60)}                  
              </p>
            </div>
            <div className="col-sm-10">
              <p className="lead">
                {this.props.eventName}
              </p>
            </div>
          </div>
          <div className="col-sm-2">
            <button type="button" className="btn btn-danger" onClick={this.handleDeleteEvent.bind(this)}>
              X
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default EventListEntry;
