import json
import urllib.request


config = json.load(open('config.json'))
azure_key = config['azure_key']
azure_region = config['azure_region']
openai_key = config['openai_key']
firebase_config = config['firebase_config']
ga_client_id = config['ga_client_id']


def get_token():
  req = urllib.request.Request(
      f'https://{azure_region}.api.cognitive.microsoft.com/sts/v1.0/issueToken',
      method='POST')
  req.add_header('Content-Type', 'application/json')
  req.add_header('Ocp-Apim-Subscription-Key', azure_key)
  azure_token = urllib.request.urlopen(req).read().decode()
  return json.dumps(dict(
    azure_token=azure_token,
    azure_region=azure_region,
    openai_key=openai_key,
    firebase_config=firebase_config,
    ga_client_id=ga_client_id,
  ))


import http.server, socketserver

class MyHandler(http.server.SimpleHTTPRequestHandler):
  def do_GET(self):
    if self.path == '/token.php':
      self.send_response(200)
      self.end_headers()
      self.wfile.write(get_token().encode())
    else:
      super().do_GET()


port = 8000
while True:
  try:
    httpd = socketserver.TCPServer(("", port), MyHandler)
    print(f'http://localhost:{port}')
    httpd.serve_forever()
    break
  except Exception as e:
    assert 'Address already in use' in str(e)
    port += 1
    print('Address in use ->', port)
