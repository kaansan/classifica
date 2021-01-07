from tornado.ioloop import IOLoop
from tornado.web import Application

import redis
import os
from handlers import AnalyzeTrackHandler


def make_app():
    urls = [
        (r'/analyze', AnalyzeTrackHandler),
    ]

    REDIS_PORT = os.environ.get('REDIS_PORT') or 6379
    REDIS_DB = os.environ.get('REDIS_DB') or 1
    REDIS_HOST = os.environ.get('REDIS_HOST') or 'localhost'
    store = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)
    settings = {'store': store}

    return Application(urls, **settings)


if __name__ == "__main__":
    app = make_app()
    PORT = os.environ.get('PORT') or 8888
    app.listen(PORT)
    print('server started at PORT: http://localhost:{0}'.format(PORT))
    IOLoop.current().start()
