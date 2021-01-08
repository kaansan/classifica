import requests
import operator
import json

from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk import tokenize

from urllib.parse import quote
from tornado.web import RequestHandler
from tornado import escape, gen
from tornado.httpclient import AsyncHTTPClient
from config import (api_key, base_url, search_endpoint,
                    lyrics_endpoint, token, artist_search_url)


class BaseHandler(RequestHandler):

    def set_default_headers(self):
        # set headers for cors, Cross origin resource secure
        self.set_header('Content-Type', 'application/json')
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Headers', '*')
        self.set_header('Access-Control-Allow-Credentials', 'true')
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def get_json_data(self, *params):
        """ Get json data from request handler """
        try:
            data = escape.json_decode(self.request.body)
        except ValueError:
            raise requests.HTTPError(400, reason='provide a valid json')

        if params:
            return [data[param] for param in params]

        return data

    def get_url(self, *params):
        """ Url constructor """
        params_count = len(params)
        placeholders = params_count * '{}' + f'&apikey={api_key}'
        url = placeholders.format(*params)
        return url

    @property
    def analyzer(self):
        return SentimentIntensityAnalyzer()

    @property
    def http_client(self):
        return AsyncHTTPClient()

    @property
    def store(self):
        return self.settings['store']

    def handle_request(self, response):
        if response.error:
            print("Error:", response.error)
        else:
            print(response.body)

    def options(self):
        """ preflight request from browser """
        self.set_status(204)
        self.finish()


class AnalyzeTrackHandler(BaseHandler):

    @gen.coroutine
    def get_artist_image(self, artist_name):
        image_url = '{}{}&token={}'.format(artist_search_url,
                                           artist_name, token)
        artist_data = yield self.http_client.fetch(image_url,
                                                   self.handle_request)
        json_data = escape.json_decode(artist_data.body)
        image = json_data['results'][0]['cover_image']
        return image

    @gen.coroutine
    def search_track(self, artist, track_name):
        url = self.get_url(base_url, search_endpoint,
                           f'&q_artist={artist}', f'&q_track={track_name}')
        request = yield self.http_client.fetch(url, self.handle_request)
        data = escape.json_decode(request.body)
        message = data.get('message', {})
        body = message.get("body")
        track_list = body.get('track_list')

        data = {}
        if track_list:
            track = track_list[0]['track']
            track_id = track['track_id']
            artist_name = track['artist_name']
            track_title = track['track_name']
            track_url = track['track_share_url']
            data.update({
                'track_id': track_id,
                'artist_name': artist_name,
                'track_title': track_title,
                'track_url': track_url
            })

            return data

        return data

    @gen.coroutine
    def get_track_lyrics(self, track_id):
        lyrics_url = self.get_url(base_url, lyrics_endpoint,
                                  f'&track_id={track_id}')

        lyrics_request = yield self.http_client.fetch(lyrics_url,
                                                      self.handle_request)

        data = escape.json_decode(lyrics_request.body)
        message = data.get('message', {})
        body = message.get('body', {})
        if body:
            lyrics = body.get('lyrics', {}).get('lyrics_body')

            return lyrics

        return None

    @gen.coroutine
    def setup_track_data(self, lyrics, artist_name, track_name, track_url):
        clean_lyrics = lyrics.replace('\n', ' ')[:400]
        new_text = tokenize.sent_tokenize(clean_lyrics)[0]
        analysis = self.analyzer.polarity_scores(new_text)
        analysis_sorted = sorted(analysis.items(),
                                 key=operator.itemgetter(1),
                                 reverse=True)
        sentiment = {k: v for k, v in analysis_sorted
                     if k not in 'compound'}
        winner = max(sentiment, key=sentiment.get)
        image = yield self.get_artist_image(artist_name)
        data = {'sentiment': sentiment,
                'lyrics': clean_lyrics,
                'track': track_name,
                'artist': artist_name,
                'winner': winner,
                'track_url': track_url,
                'image': image}

        return data

    @gen.coroutine
    def post(self):
        artist, track_name = self.get_json_data('artist', 'track')

        # replacing spaces with %20
        artist = quote(artist)
        track_name = quote(track_name)
        track_exist = self.store.get(track_name.encode('ascii'))

        if track_exist:
            self.write(json.loads(track_exist))
            return

        # Search track
        track = yield self.search_track(artist, track_name)
        track_id = track.get('track_id')

        if track_id:
            artist_name = track.get('artist_name')
            track_title = track.get('track_title')
            track_url = track.get('track_url')
            # Get lyrics
            lyrics = yield self.get_track_lyrics(track_id)
            if lyrics:
                # Set up the data
                data = yield self.setup_track_data(lyrics, artist_name,
                                                   track_title, track_url)
                self.store.set(track_name, json.dumps(data))
                self.write(data)
            else:
                self.write({'error': 'Lyrics are not avaliable'})
        else:
            self.write({'error': 'Artist and Track is not avaliable'})
