import React, { Component } from 'react';

// Single period entry, displays time in hh:mm format
class PeriodEntry extends Component {
  handleSelectPeriod() {
    this.props.onSelectPeriod(this.props.period);
  }

  render() {
    // Add 'selected' to class name if the period is currently selected
    let classString = "col-sm-2 period-entry" + 
      (this.props.isSelected ? " selected" : "");

    return(
      <div className={classString} onClick={this.handleSelectPeriod.bind(this)}>
        <p className="lead text-center">
          {Math.floor(this.props.period / 60)}:
          {(this.props.period % 60) > 10 ? 
            this.props.period % 60 :
            '0' + this.props.period % 60}
        </p>
      </div>
    );
  }
}

// Component for selecting event time
//
// Takes starting time, ending time and period length as props
// Time is internally represented as minutes in integer form
class TimeController extends Component {
  render() {
    let currentTime = this.props.startingTime;
    let periodList = [];
    let periodTable = [];

    // Create possible periods for events based on starting/ending
    // time and period length
    while ((currentTime + this.props.periodLength) < this.props.endingTime) {
      periodList.push(currentTime);
      currentTime += this.props.periodLength;
    }

    // Put period list into a 2d array with given width
    for (var j = 0; j < periodList.length; j += this.props.periodColumns) {
      periodTable.push(periodList.slice(j, j + this.props.periodColumns));
    }

    // Collect elements to output in an array
    let outputElements = [];
    periodTable.forEach((curPeriodRow) => {
      outputElements.push(<div className="row">
                          {
                            curPeriodRow.map((period) => {
                              return (<PeriodEntry
                                onSelectPeriod={(time) => this.props.onSelectPeriod(time)}
                                period={period}
                                isSelected={this.props.selectedPeriods.includes(period)}/>);
                            })
                          }
                          </div>);
    });

    return (      
      <div className="col-sm-5">
        {outputElements}
      </div>
    );
  }
}

export default TimeController;
