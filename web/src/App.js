import './App.css';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import 'semantic-ui-css/semantic.min.css'
import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Loader from 'react-loader-spinner';
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
import { Input, Image, List } from 'semantic-ui-react';

function Alert(props) {
    return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const ColorButton = withStyles(() => ({
    root: {
        color: '#162B32',
        backgroundColor: '#FF4838',
        '&:hover': {
            backgroundColor: 'red',
        },
        marginTop: '10px',
        width: '300px',
        height: '50px',
        fontSize: '20px'
    },
}))(Button);

class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            text: null,
            label: null,
            analyzedTexts: [],
            open: false,
            loading: false,
            notification: false,
            homeLoader: true
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

            fetch('http://localhost:8888/analyze', options)
                .then(response => response.json())
                .then(data => {
                    const exist = analyzedTexts.find((text) => text.track === data.track)

                    this.setState({ loading: true, homeLoader: false })

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
                })
            
            this.setState({ loading: false })
        }
    }
    
    storeArtist = (artist) => this.setState({ artist })

    storeTrack = (track) => this.setState({ track })

    renderCards = (artist, track, lyrics, image, scores, track_url) => {
        return (
            <Card className="card">
                <CardActionArea>
                    <CardMedia
                        component="img"
                        alt="Contemplative Reptile"
                        height="400"
                        style={{ 'width': '100%' }}
                        image={image}
                        title="Contemplative Reptile"
                    />
                    <CardContent>
                        <Typography className="artist-track" variant="h5" color="textSecondary" component="p">
                            {artist} - {track}
                        </Typography>
                        <Typography className="track-lyrics" color="textSecondary" component="p">
                            {lyrics}
                        </Typography>
                        {scores}
                        <Typography className="track-lyrics" color="textSecondary" component="p">
                            <a href={track_url}>See lyrics ...</a>
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
                    type="Audio"
                    color="#FF4838"
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
            const { artist, track, sentiment, lyrics, winner, track_url, image } = text

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
                    <List horizontal key={i}>
                        <List.Item className="emojis">
                            <Image avatar src={logo}/>
                            <List.Content>
                                <List.Header style={{ color: k === winner ? ' #FF4838': 'black', fontSize: '20px' }}>{sentiment[k]}</List.Header>
                                <span style={{ color: k === winner ? ' #FF4838': 'black', fontSize: '16px' }}>{text}</span>
                            </List.Content>
                        </List.Item>
                    </List>
                )
            })

            if (sentiment) {
                return (
                    <div key={i}>
                        <div>{this.renderCards(artist, track, lyrics, image, renderScores, track_url)}</div>
                    </div>
                )    
            }
        })
        
        return items
    }

    renderHomeLoader = (homeLoader) => {
        if (homeLoader) {
            return (
                <Loader
                    type="Audio"
                    color="#162B32"
                    height={400}
                    width={400}
                    style={{ marginRight: '5%' }}
                />
            )
        }
    }

    render(){
        const { artist, track, loading, notification, homeLoader } = this.state

        return (
            <div className="container">
                <div className='row'>
                    <div className='column'>
                        <section className="classificaSection">
                            <Snackbar open={notification} autoHideDuration={1000} onClose={() => this.handleClose('notification')}>
                                <Alert onClose={this.handleClose} severity="success">
                                    Already exist !
                                </Alert>
                            </Snackbar>
                            {this.renderLoading(loading)}
                            <h1 className="header">Classifica</h1>
                            <Input className="input" size='mini' icon='search' placeholder='Artist...' onChange={(e) => this.storeArtist(e.target.value)}/>
                            <Input className="input" size='mini' icon='search' placeholder='Track...' onChange={(e) => this.storeTrack(e.target.value)}/>
                            <ColorButton onClick={() => this.sendData(artist, track)}>
                                Analyze
                            </ColorButton>
                        </section>
                    </div>
                    <div className='tracks-column'>
                        <section className="tracksSection">
                            {this.renderHomeLoader(homeLoader)}
                            {this.renderAnalyzedTexts()}
                        </section>
                    </div>
                </div>
            </div>
        )
    }
}

export default App;
