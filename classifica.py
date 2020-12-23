#import pandas as pd
"""
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.corpus import twitter_samples 
from nltk import tokenize

# get 5000 posivie and negative tweets
all_positive_tweets = twitter_samples.strings('positive_tweets.json')
analyzer = SentimentIntensityAnalyzer()

all_positive_tweets[100]
analyzer.polarity_scores(all_positive_tweets[100])

## First test
example_text = "I am so not happy. cant you seee it ?"
# so you need to tokenize!
five_positive_tweets = all_positive_tweets[0:5]
new_text = tokenize.sent_tokenize(example_text)
five_positive_tweets.extend(new_text)

for tweet in five_positive_tweets:
    analysis = analyzer.polarity_scores(tweet)
    print('Tweet: {}, Scores: {}'.format(tweet, analysis), end='\n')

"""
