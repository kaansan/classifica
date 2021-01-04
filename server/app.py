from tornado.ioloop import IOLoop
from tornado.web import Application

import redis
from handlers import AnalyzeTrackHandler


def make_app():
    urls = [
        (r'/analyze', AnalyzeTrackHandler),
    ] 
  
    store = redis.Redis(host='localhost', port=6379, db=0)

    settings = {'store': store}

    return Application(urls, debug=True, **settings)


if __name__ == "__main__":
    app = make_app()
    PORT = 8888
    app.listen(PORT)
    print('server started at PORT: {0}'.format(PORT))
    print('http://localhost:8888')
    IOLoop.current().start()
