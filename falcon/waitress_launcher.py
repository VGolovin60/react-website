from database_server import app
from waitress import serve

# Hosts sample application server on port 8000
serve(app, host='127.0.0.1', port=8000)