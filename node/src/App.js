import React, { Component } from 'react';
import './App.css';

import ButtonAddEvent from './Components/ButtonAddEvent'
import AddEventContainer from './Components/AddEventContainer';
import EventListEntry from './Components/EventListEntry';
import TimeController from './Components/TimeController';

import $ from 'jquery'

// Server and port for the event database
const dbServer = "localhost";
const dbPort = "8000";

// Starting/ending time for events and period length
// Represented in minutes (for instance, starting time of 600 is 10:00)
const startingTime = 600;
const endingTime = 840;
const periodLength = 15;

class App extends Component {
  constructor() {
    super();
    this.state = {
      newEventName: "",
      newEventTime: "",
      errorMessage: "",
      eventList: [],
      selectedPeriods: []
    }

    this.syncEventList();
  }

  // Hides popup window for adding new events and clears entered name and time
  hideNewEventPopup() {
    this.setState({newEventName: "", newEventTime: ""});
    $("#popupAddEvent").hide();
  }

  // Updates new event name being entered
  handleNewEventNameChanged(newEventName) {
    this.setState({ newEventName: newEventName});
  }

  // Updates new event time being entered
  handleNewEventTimeChanged(newEventTime) {
    this.setState({ newEventTime: newEventTime});
  }

  // Sets an event selected state by ID
  handleEventSelected(eventId, isSelected) {
    let curEventList = this.state.eventList;
    let selectedEventIdx = curEventList.findIndex(function(curEvent) {
      return (curEvent.id === eventId);
    });

    if (selectedEventIdx !== -1) {
      let curEvent = curEventList[selectedEventIdx];
      curEvent.selected = isSelected;
    }

    this.setState({ eventList: curEventList });
    this.updateSelectedPeriods();
  }

  // Marks time periods as selected based on the time values of selected events
  updateSelectedPeriods() {
    let selectedPeriods = [];
    this.state.eventList.forEach(function(curEvent) {
      if (curEvent.selected) {
        selectedPeriods.push(curEvent.eventTime);
      }
    });

    this.setState({ selectedPeriods: selectedPeriods });
  }

  // Handles adding a new event to the database, re-syncs event list if added successfully
  handleNewEventAdded() {
    if (this.state.newEventName === "") {
      this.setState({ errorMessage: "Ошибка: Имя мероприятия не должно быть пустым."});
      return;
    }

    // Parse time in 'hh:mm' format with regex
    let timeRegex = /(\d\d?):(\d\d?)/g;
    let parsedTime = timeRegex.exec(this.state.newEventTime);

    if (parsedTime == null) {
      this.setState({ errorMessage: "Ошибка: Время должно быть введено в формате чч:мм."});
      return;
    }

    parsedTime = parseInt(parsedTime[1], 10) * 60 + parseInt(parsedTime[2], 10);
    if (parsedTime < startingTime || parsedTime >= endingTime || 
      (parsedTime - startingTime) % periodLength !== 0) {
      this.setState({ errorMessage: "Ошибка: Введеное время не равно одному из допущенных периодов"});
      return;
    }

    $.post("http://" + dbServer + ":" + dbPort + "/",
      "{\"event_name\": \"" + this.state.newEventName + "\", " + 
      "\"event_time\": " + parsedTime + "}", 
      (data, status) => {
        if (data[0].status === 'ok') {
          this.setState({ errorMessage: ""});
          this.syncEventList();
          this.hideNewEventPopup();          
        } else {
          this.setState({ errorMessage: data[0].status });
        }
      }
    );
  }

  // Deletes an event by ID and reloads event list from server
  handleEventDeleted(eventId) {
    $.ajax({url: "http://" + dbServer + ":" + dbPort + "/",
      method: "DELETE",
      data: "{\"id\": " + eventId + "}",
      success: (result) => {
        if (result[0].status === 'ok') {
          this.setState({ errorMessage: ""});
          this.syncEventList();
        } else {
          this.setState({ errorMessage: result[0].status });
        }
      }
    });
  }

  // Sets time for all selected events
  // If successful, re-sort event list and update period selection
  handleSetEventTime(eventTime) {
    let idList = "[";
    this.state.eventList.forEach((curEvent) => {
      if (curEvent.selected) {
        if (idList.length > 1) {
          idList += ", ";
        }

        idList += curEvent.id;
      }
    });
    idList += "]";

    $.ajax({url: "http://" + dbServer + ":" + dbPort + "/",
      method: "PUT",
      data: "{\"ids\": " + idList + ", " +
        "\"event_time\": " +  eventTime + "}",
      success: (result) => {
        if (result[0].status === 'ok') {
          let curEventList = this.state.eventList;

          curEventList.forEach((curEvent) => {
            if (curEvent.selected) {
              curEvent.eventTime = eventTime;
            }
          });

          this.setState({ eventList: curEventList });

          this.setState({ errorMessage: ""});
          this.sortEventList();
          this.updateSelectedPeriods();
        } else {
          this.setState({ errorMessage: result[0].status });
        }
      }
    });
  }

  // Loads event list from the falcon server to state
  syncEventList() {
    $.get("http://" + dbServer + ":" + dbPort + "/", 
      (data, status) => {
        let curEventList = [];
        
        for (var i = 0; i < data.length; i++) {
          curEventList.push({ 
            id: data[i].id, 
            eventName: data[i].event_name, 
            eventTime: data[i].event_time,
            selected: false });
        }

        this.setState({ eventList: curEventList });

        this.sortEventList();
      }
    )
  }

  // Sort event list by time
  sortEventList() {
    let curEventList = this.state.eventList;

    curEventList.sort(function(a, b) {
      return (a.eventTime > b.eventTime);
    })

    this.setState({ eventList: curEventList });
  }

  render() {
    const events = this.state.eventList.map((curEvent, id) => {
      return (
        <div key={curEvent.id}>
          <EventListEntry
            eventName = {curEvent.eventName}
            eventTime = {curEvent.eventTime}
            eventID = {curEvent.id}
            isSelected = {curEvent.selected}
            onSelected = {(id, isSelected) => this.handleEventSelected(id, isSelected)}
            onDelete = {(id) => this.handleEventDeleted(id)}/>
        </div>
      )
    });

    // Create div with error message alert if it should be displayed
    let errorMessageDiv = [];
    if (this.state.errorMessage !== "") {
      errorMessageDiv.push(
        <div className="row">
          <div className="col-sm-10 alert alert-danger">
            {this.state.errorMessage}
          </div>
        </div>
      );
    }

    return (
      <div className="container">
        <div>
          <p className="lead text-center">
            Список мероприятий
          </p>
        </div>
        <div className="row add-event-row">
          <ButtonAddEvent 
            onClearEvent = {() => this.setState({ newEventName: "", newEventTime: ""})}/>
          <AddEventContainer 
            onNameChanged = {(name) => this.handleNewEventNameChanged(name)}
            onTimeChanged = {(time) => this.handleNewEventTimeChanged(time)}
            onAddEvent = {() => this.handleNewEventAdded()}
            onCancel = {() => this.hideNewEventPopup()}
            curName = {this.state.newEventName}
            curTime = {this.state.newEventTime}/>
        </div>
        {errorMessageDiv}
        <div className="row">
          <div className="col-sm-7">
            {events}
          </div>
          <TimeController
            startingTime={startingTime}
            endingTime={endingTime}
            periodLength={periodLength}
            periodColumns={3}
            selectedPeriods={this.state.selectedPeriods}
            onSelectPeriod={(time) => this.handleSetEventTime(time)}/>
        </div>
      </div>
    );
  }
}

export default App;
