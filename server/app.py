from tornado.ioloop import IOLoop
from tornado.web import Application

from handlers import GetUserTweets


def make_app():
    urls = [
        (r"/", GetUserTweets),
    ]

    return Application(urls, debug=True)


if __name__ == "__main__":
    app = make_app()
    PORT = 8888
    app.listen(PORT)
    print('server started at PORT: {0}'.format(PORT))
    print('http://localhost:8888')
    IOLoop.current().start()