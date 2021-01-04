from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk import tokenize

import requests
import operator
import json
from tornado.web import RequestHandler
from tornado import escape, gen
from tornado.httpclient import AsyncHTTPClient
from config import api_key, base_url, search_endpoint, lyrics_endpoint


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
    
    def generate_track_uuid(self):
        return uuid.uuid4()

    def handle_request(response):
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
    def post(self):
        artist, track = self.get_json_data('artist', 'track')

        artist = artist.replace(' ', '%20')
        track = track.replace(' ', '%20')

        track_exist = self.store.get(track.encode('ascii'))
        if track_exist:
            self.write(json.loads(track_exist))
            return

        url = self.get_url(base_url, search_endpoint,
                           f'&q_artist={artist}', f'&q_track={track}')
                
        request = yield self.http_client.fetch(url, self.handle_request)
        data = escape.json_decode(request.body)
        track_status = data['message']['header']['status_code']
        if track_status == 200:
            data = escape.json_decode(request.body)
            track_list = data.get('message').get('body').get('track_list')
            if (track_list):
                track_id = track_list[0]['track']['track_id']
                artist_name = track_list[0]['track']['artist_name']
                track_name = track_list[0]['track']['track_name']
                lyrics_url = self.get_url(base_url, lyrics_endpoint,
                                          f'&track_id={track_id}')
                lyrics_request = yield self.http_client.fetch(
                                       lyrics_url,
                                       self.handle_request)

                data = escape.json_decode(lyrics_request.body)
                message = data['message']
                body = message['body']
                status = message['header']['status_code']
                if status == 200:
                    lyrics = body['lyrics']['lyrics_body']
                    # inspect first 600 chars
                    clean_lyrics = lyrics.replace('\n', ' ')[:600]
                    new_text = tokenize.sent_tokenize(clean_lyrics)[0]
                    analysis = self.analyzer.polarity_scores(new_text)
                    analysis_sorted = sorted(analysis.items(),
                                             key=operator.itemgetter(1),
                                             reverse=True)
                    sentiment = {k: v for k, v in analysis_sorted
                                 if k not in 'compound'}
                    winner = max(sentiment, key=sentiment.get)
                    data = {'sentiment': sentiment, 'lyrics': clean_lyrics,
                            'track': track_name, 'artist': artist_name,
                            'winner': winner}
                    self.store.set(track, json.dumps(data))
                    self.write(data)
                else:
                    self.write({'error': 'Lyrics are not avaliable'})
            else:
                self.write({'error': 'Artist and Track is not avaliable'})
        else:
            self.write({'error': 'Artist is not valid'})
