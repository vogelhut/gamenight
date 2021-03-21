import {useState, useEffect, useRef} from 'react'
import {ResponsiveContainer, BarChart, CartesianGrid, Bar, XAxis, YAxis, Tooltip} from 'recharts'
import { useSnackbar } from 'notistack'
import CssBaseline from '@material-ui/core/CssBaseline'
import Grid from '@material-ui/core/Grid'
import Container from '@material-ui/core/Container'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import ListSubheader from '@material-ui/core/ListSubheader'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Dialog from '@material-ui/core/Dialog'
import DialogTitle from '@material-ui/core/DialogTitle'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import { makeStyles } from '@material-ui/core/styles'
import Axios from 'axios'
let axios // will be set in initial useEffect

import games from '../gamelist'
games.forEach(game => game.votes = 0)

function sortFunc(a, b) {
  if (a.votes > b.votes)
    return -1
  else if (a.votes < b.votes)
    return 1
  else
    return 0
}

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
}))

export default function Index({pushbulletKey, hostPhoneNum}) {
  const [poll, setPoll] = useState(0)
  const [mode, setMode] = useState('chat')
  const [messages, setMessages] = useState([])
  const [votes, setVotes] = useState([...games])
  const [showDialog, setShowDialog] = useState(false)
  const [played, setPlayed] = useState([])
  const lastPoll = useRef(Date.now() / 1000)
  const textArea = useRef()

  const { enqueueSnackbar } = useSnackbar()

  useEffect(() => {
    // set up axios global config
    axios = Axios.create({
      baseURL: 'https://api.pushbullet.com/v2/',
      headers: {'Access-Token': pushbulletKey}
    })
    // set up polling
    const interval = setInterval(() => {
      setPoll(cur => (cur+1)%100)
    }, 1000)
    return (() => clearInterval(interval))
  }, [])

  useEffect(() => {
    // every poll interval, check pushbullet for new messages and add to the vote/message list
    axios.get('pushes', {params: {
      active: true,
      modified_after: lastPoll.current
    }})
    .then(({data}) => {
      lastPoll.current = Date.now() / 1000
      if (data.pushes.length) {
        if (mode === 'vote') {
          const newVotes = data.pushes.map(push => ({voter: push.title || 'Host', vote: parseInt(push.body) - 1}))
            .filter(({vote}) => vote >= 0 && vote < games.length)
          newVotes.length && setVotes(prevVotes => {
            const curVotes = [...prevVotes]
            newVotes.forEach(vote => {
              curVotes[vote.vote].votes++
              enqueueSnackbar(`${vote.voter} voted for ${games[vote.vote].name}`)
            })
            return curVotes
          })
        }
        setMessages((prev) => prev.concat(data.pushes.map((push) => `${push.title || 'Host'}: ${push.body}`)))
        data.pushes.forEach((push) => {
          axios.delete(`pushes/${push.iden}`).catch((err) => console.error(err))
        })
      }
    }).catch(({response}) => console.error(response))
  }, [poll])

  useEffect(() => {
    if (textArea.current)
      textArea.current.scrollTop = textArea.current.scrollHeight
  }, [messages])

  
const makeList = (startItem, endItem) => {
  // format a subset of the games into a nice list component
  const items = []
  let lastPack = 0
  for (let index = startItem; index < endItem; index++) {
    const game = games[index]
    if (game.pack !== lastPack) {
      lastPack = game.pack
      items.push(<ListSubheader disableSticky key={game.pack}>Party Pack {game.pack}</ListSubheader>)
    }
    const content = <ListItemText>{game.name}</ListItemText>
    const item = played.includes(game.name) ? <del>{content}</del> : content
    items.push(<ListItem key={game.name}>
      <ListItemIcon><b>{index+1}</b></ListItemIcon>
      {item}
    </ListItem>)
  }  

  return <>
    <List dense>
      {items}
    </List>
  </>
}

  const handleClose = () => {
    // invoked after a game has been chosen, prepares page for the next vote
    setPlayed(prevPlayed => {
      const newPlayed = [...prevPlayed]
      newPlayed.push([...votes].sort(sortFunc)[0].name)
      return newPlayed
    })
    setShowDialog(false)
    games.forEach((game) => game.votes = 0)
    setVotes([...games])
  }

  const classes = useStyles()

  return (
    <>
      <CssBaseline/>
      <Container component="main" maxWidth="lg">
        <div className={classes.paper}>
          {mode === 'chat' &&
          <>
            <Typography variant='h3' gutterBottom>
              Welcome to Vogelhut Game Night
            </Typography>
            <Typography variant='h4' paragraph>
              Text or WhatsApp <code>{hostPhoneNum}</code> to say hello!
            </Typography>
            <Grid container justify='center'>
              <Grid item xs={8}>
                <TextField inputRef={textArea} variant='outlined' fullWidth value={messages.join('\n')} multiline rows={10}/>
              </Grid>
            </Grid>
            <Typography>The game will start soon...</Typography>
            <Button onClick={() => setMode('vote')}>Start</Button>
          </>
          }
          {mode === 'vote' &&
          <>
            <Typography variant='h4' paragraph>
              Vote by sending your choice (1-30) to <code>{hostPhoneNum}</code>
            </Typography>
            <Grid container>
              <Grid item xs='auto'>
                {makeList(0, 6)}
              </Grid>
              <Grid item xs>
                {makeList(6, 11)}
              </Grid>
              <Grid item xs>
                {makeList(11, 16)}
              </Grid>
              <Grid item xs>
                {makeList(16, 20)}
              </Grid>
              <Grid item xs='auto'>
                {makeList(20, 25)}
              </Grid>
              <Grid item xs>
                {makeList(25, 30)}
              </Grid>
              <Grid item xs={12}>
                <ResponsiveContainer width='100%' height={265}>
                  <BarChart data={[...votes].sort(sortFunc).slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name"  />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='votes'/>
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
            <Button onClick={() => setShowDialog(true)}>End Vote</Button>
            <Dialog open={showDialog} onClose={handleClose}>
              <DialogTitle>Voting has ended</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Get ready to play {[...votes].sort(sortFunc)[0].name}
                </DialogContentText>
              </DialogContent>
            </Dialog>
          </>
          }
        </div>
      </Container>
    </>
  )
}

export async function getStaticProps() {
  return {
    props: {
      pushbulletKey = process.env.PUSHBULLET_API_KEY,
      hostPhoneNum = process.env.HOST_PHONE_NUM
    }
  }
}
