import './App.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import React, { Component } from 'react';
import { Button, TextField } from '@material-ui/core';
import Loader from 'react-loader-spinner';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import happyLogo from './emojis/happy.png'
import angryLogo from './emojis/angry.png'
import neutralLogo from './emojis/neutral.png'
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            text: null,
            label: null,
            analyzedTexts: [],
            open: false,
            loading: null,
            notification: false
        }
    }

    sendData = (artist, track) => {        
        if (artist && track) {
            const { analyzedTexts } = this.state

            const options = {
                method: 'POST',
                headers: { 'Content-Tpe': 'application/json' },
                body: JSON.stringify({ artist, track })
            }
            
            this.setState({ loading: true })

            fetch('http://localhost:8888/analyze', options)
                .then(response => response.json())
                .then(data => {
                    const exist = analyzedTexts.find((text) => text.track === data.track)

                    if (data?.error) {
                        this.setState({ open: true })
                    }

                    if (exist) {
                        this.setState({ notification: true })
                        return
                    }

                    if (!exist) {
                        this.setState({ analyzedTexts: [ ...analyzedTexts, data ] })
                    }

                    this.setState({ loading: false })
                })
        }
    }
    
    storeArtist = (artist) => this.setState({ artist })

    storeTrack = (track) => this.setState({ track })

    renderLyrics = (artist, track, lyrics) => {
        return (
            <Card>
                <CardActionArea>
                    <CardMedia
                        image={happyLogo}
                    />
                    <CardContent>
                        <Typography variant="body2" color="textSecondary" component="p">
                            {artist} - {track}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                            {lyrics}
                        </Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        )
    }

    handleClose = (element) => this.setState({ [`${element}`]: false })

    renderLoading = (loading) => {
        if (loading) {
            return (
                <Loader
                    type="Puff"
                    color="black"
                    height={100}
                    width={100}
                    timeout={500}
                />
            )
        }
    }
  
    renderAnalyzedTexts = () => {
        const { analyzedTexts, open } = this.state

        const items = analyzedTexts.map((text, i) =>  {
            const { artist, track, sentiment, lyrics, winner } = text

            if (text?.error) {
                return (
                    <Snackbar open={open} autoHideDuration={2000} onClose={() => this.handleClose('open')}>
                        <Alert onClose={this.handleClose} severity="error">
                            {text.error}
                        </Alert>
                    </Snackbar>
                )
            }

            const renderScores = Object.keys(sentiment).map((k, i) => {
                let logo, text
                
                if (k === 'neg') {
                    logo = angryLogo
                    text = 'Negative'
                } else if ( k === 'neu') {
                    logo = neutralLogo
                    text = 'Neutral'
                } else {
                    logo = happyLogo
                    text = 'Positive'
                }

                return (
                    <div key={i}>
                        <List>
                            <ListItem>
                                <ListItemAvatar>
                                    <img style={{ width: k === winner ? '60px': '40px' }} className="logo" src={logo} />  
                                </ListItemAvatar>
                                <ListItemText primary={text} secondary={sentiment[k]} />
                            </ListItem>
                        </List>
                    </div>
                )
            })

            if (sentiment) {
                return (
                    <div key={i}>
                        <div>{this.renderLyrics(artist, track, lyrics)}</div>
                        <div>{renderScores}</div>
                    </div>
                )    
            }
        })
        
        return items
    }

    render(){
        const { artist, track, loading, notification } = this.state

        return (
            <div className="App">
                <section className="App-header">
                    <Snackbar open={notification} autoHideDuration={1000} onClose={() => this.handleClose('notification')}>
                        <Alert onClose={this.handleClose} severity="success">
                            Already exist !
                        </Alert>
                    </Snackbar>
                    <h1 className="header">Classifica</h1>
                    <div>Artist</div>
                    <TextField 
                        inputProps={{ style: { textAlign: 'center', backgroundColor: 'white' } }} 
                        variant="outlined" 
                        onChange={(e) => this.storeArtist(e.target.value)}
                    />
                    <div>Track</div>
                    <TextField                         
                        inputProps={{ style: { textAlign: 'center', backgroundColor: 'white', marginTop: '10px' } }} 
                        variant="outlined" 
                        onChange={(e) => this.storeTrack(e.target.value)}
                    />
                    <Button style={{ marginTop: '10px' }} variant="contained" color="secondary" onClick={() => this.sendData(artist, track)}>
                        Analyze
                    </Button>
                    <h1>Tracks</h1>
                    {this.renderLoading(loading)}
                    {this.renderAnalyzedTexts()}
                </section>
            </div>
        )
    }
}

export default App;
