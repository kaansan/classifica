from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.corpus import twitter_samples 
from nltk import tokenize

from tornado.web import RequestHandler

import tweepy
from credentials import (CONSUMER_KEY, CONSUMER_SECRET,
                         ACCESS_TOKEN, ACCESS_SECRET)

# Tokenizing will be used later
# new_text = tokenize.sent_tokenize(example_text)

def twitter_setup():
    # Setup twitter account
    auth = tweepy.OAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
    auth.set_access_token(ACCESS_TOKEN, ACCESS_SECRET)

    api = tweepy.API(auth)
    return api


"""
# We create an extractor object:
extractor = twitter_setup()

# We create a tweet list as follows:
tweets = extractor.user_timeline(screen_name="realDonaldTrump", count=200)
print("Number of tweets extracted: {}.\n".format(len(tweets)))
"""

class GetUserTweets(RequestHandler):
    def get(self):
        all_positive_tweets = twitter_samples.strings('positive_tweets.json')
        analyzer = SentimentIntensityAnalyzer()

        five_positive_tweets = all_positive_tweets[0:5]
        analyzed = []
        for text in five_positive_tweets:
            analysis = analyzer.polarity_scores(text)
            analyzed.append(analysis)

        self.write({
            'five_positive_tweets': five_positive_tweets,
            'analyzed': analyzed
        })
        