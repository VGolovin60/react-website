import React, { Component } from 'react';
import $ from 'jquery';

class ButtonAddEvent extends Component {
	handleClick() {
		this.props.onClearEvent();
		$("#popupAddEvent").toggle();		
	}


	render() {
		return (
			<div className="col-sm-7 add-event-button">
				<p className="lead">
					При нажатии на кнопку всплывет окно с возможностью добавления нового мероприятия в расписание.
				</p>
				<button type="button" className="btn btn-primary" onClick={() => this.handleClick()}>
					Добавить мероприятие
				</button>
			</div>
		);
	}
}

export default ButtonAddEvent;
