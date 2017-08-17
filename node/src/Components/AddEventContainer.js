import React, { Component } from 'react';

// Popup menu for adding a new event to the list
class AddEventContainer extends Component {
  handleNameChange(e) {
    this.props.onNameChanged(e.target.value);    
  }

  handleTimeChange(e) {
    this.props.onTimeChanged(e.target.value);    
  }

  handleAddEvent() {
    this.props.onAddEvent();
  }

  handleCancel() {
    this.props.onCancel();
  }

  render() {
    return (
      <div className="col-sm-4">
        <div className="panel panel-default add-event-container" id="popupAddEvent">
          <div className="panel-heading">
            <p className="lead text-center">Добавление нового пункта</p>
          </div>
          <div className="panel-body">
            <label htmlFor="name">Название:</label>
            <input type="text" onChange={this.handleNameChange.bind(this)} 
                className="form-control" id="name" 
                value={this.props.curName}/>
            <label htmlFor="name">Время (чч:мм):</label>
            <input type="text" onChange={this.handleTimeChange.bind(this)} 
                className="form-control" id="name" 
                value={this.props.curTime}/>
            <br/>
            <button type="button" className="btn btn-primary" onClick={this.handleAddEvent.bind(this)}>
              OK
            </button>
            <button type="button" className="btn btn-primary" onClick={this.handleCancel.bind(this)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AddEventContainer;
