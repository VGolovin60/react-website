import json
import falcon
from falcon_cors import CORS
import sqlalchemy

# This is the database server that handles requests on updating the event list.
# 
# Event list is stored in a SQL database accessed through sqlalchemy.

# Default db settings: postgres engine, user: postgres, password:root, hosted at localhost:5432
#
# Uses database named 'test'
#
# Event data is stored in event_list table with the following columns:
#	id			serial, primary key
#	event_name	text
#	event_time	integer (event time in minutes)

# Settings for SQL engine
SQL_ENGINE		=	'postgresql'
SQL_USER		=	'postgres'
SQL_PASSWORD	=	'root'
SQL_ADDRESS		=	'localhost'
SQL_PORT 		=	'5432'
SQL_DATABASE	=	'test'

# Settings for allowed event time values
# Represented in minutes (for example, starting time of 600 means 10:00)
STARTING_TIME	=	600
ENDING_TIME		=	840
PERIOD_LENGTH	=	15

cors_allow_all = CORS(allow_credentials_all_origins=True,
					allow_all_origins=True,
					allow_all_headers=True,
					allow_all_methods=True)

class EventDatabase(object):

	cors = cors_allow_all

	# Checks that evnt time fits given constraints
	def check_event_time(self, event_time):		
		return (event_time >= STARTING_TIME and\
			event_time < ENDING_TIME and\
			(event_time % PERIOD_LENGTH) == 0)

	def on_get(self, req, resp):
		# Collects events from the database list and outputs them in JSON
		eng = sqlalchemy.create_engine(SQL_ENGINE + '://' + 
			SQL_USER + ':' + SQL_PASSWORD + 
			'@' + SQL_ADDRESS + ':' + SQL_PORT + '/' + SQL_DATABASE)
		eng.echo = False

		meta = sqlalchemy.MetaData()
		meta.reflect(bind=eng)

		event_list = sqlalchemy.Table('event_list', meta, autoload=True)

		try:
			con = eng.connect()
		except:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'GET')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: failed to connect to SQL database'}])
			return

		result_array = []
		rs = con.execute(sqlalchemy.select([event_list]))
		for row in rs:
			result_array.append({
				'id': row['id'], 
				'event_name': row['event_name'],
				'event_time': row['event_time']})

		con.close()

		resp.status = falcon.HTTP_200
		resp.set_header('Access-Control-Allow-Origin', '*')
		resp.set_header('Access-Control-Allow-Methods', 'GET')
		resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
		resp.body = json.dumps(result_array)

	def on_post(self, req, resp):
		# Get event name and time from received json and create new database entry for the event
		raw_json = req.stream.read().decode('utf-8')
		try:
			data = json.loads(raw_json)
			event_name = data['event_name']
			event_time = data['event_time']
		except Exception as detail:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'POST')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: Exception raised during JSON parsing: ' + str(detail)}])
			return

		# Check if event name is empty
		if (event_name == ''):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'POST')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: Event name is empty'}])
			return

		# Checks validity of event time
		if (not (type(event_time) is int)):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'POST')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: event time should be represented as an integer'}])
			return

		if (not (self.check_event_time(event_time))):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'PUT')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: incorrect event time value'}])
			return

		eng = sqlalchemy.create_engine(SQL_ENGINE + '://' + 
			SQL_USER + ':' + SQL_PASSWORD + 
			'@' + SQL_ADDRESS + ':' + SQL_PORT + '/' + SQL_DATABASE)
		eng.echo = False

		meta = sqlalchemy.MetaData()
		meta.reflect(bind=eng)

		event_list = sqlalchemy.Table('event_list', meta, autoload=True)

		try:
			con = eng.connect()
		except:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'POST')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: failed to connect to SQL database'}])
			return

		rs = con.execute(event_list.insert().values(event_name=event_name, event_time=event_time))

		con.close()

		# Operation successful, return 'ok' status
		resp.status = falcon.HTTP_201
		resp.set_header('Access-Control-Allow-Origin', '*')
		resp.set_header('Access-Control-Allow-Methods', 'POST')
		resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
		resp.body = json.dumps([{'status': 'ok'}])

	def on_put(self, req, resp):
		# Updates time for a list of events
		#
		# Receives list of event IDs to update in an array of integers as the 'ids' param
		# Receives time to set as the 'event_time' param
		raw_json = req.stream.read().decode('utf-8')
		try:
			data = json.loads(raw_json)
			id_list = data['ids']
			event_time = data['event_time']
		except Exception as detail:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'PUT')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: Exception raised during JSON parsing: ' + str(detail)}])
			return

		# Event IDs should be received as an array of integers
		if (not (type(id_list) is list)):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'PUT')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: id list should be an array of integers'}])
			return

		for i in id_list:
			if (not (type(i) is int)):
				resp.status = falcon.HTTP_400
				resp.set_header('Access-Control-Allow-Origin', '*')
				resp.set_header('Access-Control-Allow-Methods', 'PUT')
				resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
				resp.body = json.dumps([{'status': 'Error: id list should be an array of integers'}])
				return

		# Checks validity of event time
		if (not (type(event_time) is int)):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'PUT')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: event time should be represented as an integer'}])
			return

		if (not (self.check_event_time(event_time))):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'PUT')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: incorrect event time value'}])
			return

		eng = sqlalchemy.create_engine(SQL_ENGINE + '://' + 
			SQL_USER + ':' + SQL_PASSWORD + 
			'@' + SQL_ADDRESS + ':' + SQL_PORT + '/' + SQL_DATABASE)
		eng.echo = False

		meta = sqlalchemy.MetaData()
		meta.reflect(bind=eng)

		event_list = sqlalchemy.Table('event_list', meta, autoload=True)

		try:
			con = eng.connect()
		except:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'POST')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: failed to connect to SQL database'}])
			return

		# Update event time for every given ID
		for i in id_list:
			con.execute(event_list.update().\
				where(event_list.c.id == i).\
				values(event_time = event_time))

		con.close()

		# Operation successful, return 'ok' status
		resp.status = falcon.HTTP_200
		resp.set_header('Access-Control-Allow-Origin', '*')
		resp.set_header('Access-Control-Allow-Methods', 'PUT')
		resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
		resp.body = json.dumps([{'status': 'ok'}])

	def on_delete(self, req, resp):
		# Delete event with given id
		# 
		# Receives a json object with 'id' property being the event id to delete
		raw_json = req.stream.read().decode('utf-8')
		try:
			data = json.loads(raw_json)
			req_id = data['id']
		except Exception as detail:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'DELETE')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: Exception raised during JSON parsing: ' + str(detail)}])
			return

		# id should be sent as integer
		if (not (type(req_id) is int)):
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'DELETE')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: id value received is not integer'}])
			return

		eng = sqlalchemy.create_engine(SQL_ENGINE + '://' + 
			SQL_USER + ':' + SQL_PASSWORD + 
			'@' + SQL_ADDRESS + ':' + SQL_PORT + '/' + SQL_DATABASE)
		eng.echo = False

		meta = sqlalchemy.MetaData()
		meta.reflect(bind=eng)

		event_list = sqlalchemy.Table('event_list', meta, autoload=True)

		try:
			con = eng.connect()
		except:
			resp.status = falcon.HTTP_400
			resp.set_header('Access-Control-Allow-Origin', '*')
			resp.set_header('Access-Control-Allow-Methods', 'DELETE')
			resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
			resp.body = json.dumps([{'status': 'Error: failed to connect to SQL database'}])
			return

		con.execute(event_list.delete().where(event_list.c.id == req_id))

		con.close()

		# Operation successful, return 'ok' status
		resp.status = falcon.HTTP_200
		resp.set_header('Access-Control-Allow-Origin', '*')
		resp.set_header('Access-Control-Allow-Methods', 'DELETE')
		resp.set_header('Access-Control-Allow-Headers', 'Content-Type')
		resp.body = json.dumps([{'status': 'ok'}])

	def on_options(self, req, res):
		# Handle OPTIONS requests, send CORS headers
		res.status = falcon.HTTP_200
		res.set_header('Access-Control-Allow-Origin', '*')
		res.set_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
		res.set_header('Access-Control-Allow-Headers', 'Content-Type')

app = falcon.API()

events = EventDatabase()

app.add_route('/', events)