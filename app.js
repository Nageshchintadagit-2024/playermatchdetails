const express = require('express')

const app = express()

const {open} = require('sqlite')

const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

app.use(express.json())

let dbConnection = null

let initializeDbConnectionAndServer = async () => {
  try {
    dbConnection = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Successfully Running...')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
initializeDbConnectionAndServer()

convertsPlayerDetailsObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

convertMatchDetailsObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

//API 1

app.get('/players/', async (request, response) => {
  const query = `SELECT * FROM player_details`

  const playerDetailsArray = await dbConnection.all(query)

  response.send(
    playerDetailsArray.map(eachPlayer =>
      convertsPlayerDetailsObject(eachPlayer),
    ),
  )
})

//API 2

app.get('/players/:playerId/', async (request, response) => {
  let {playerId} = request.params

  const query = `
     select 
     * from player_details where player_id=${playerId};
    `

  const playerDetails = await dbConnection.get(query)

  response.send(convertsPlayerDetailsObject(playerDetails))
})

//API 3
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params

  const {playerName} = request.body
  const query = `
   UPDATE 
       player_details 
   SET 
     player_name='${playerName}'
  WHERE 
     player_id=${playerId};
  `
  await dbConnection.run(query)
  response.send('Player Details Updated')
})

//API 4
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params

  const query = `select * from match_details where match_id=${matchId}`
  const matchDetails = await dbConnection.get(query)

  response.send(convertMatchDetailsObject(matchDetails))
})
//API 5
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params

  const query = `
    SELECT  * 
    FROM 
    (match_details 
    INNER JOIN 
    player_match_score
    ON match_details.match_id =player_match_score.match_id) as t

    INNER JOIN 

    player_details 

    ON t.player_id=player_details.player_id

    WHERE player_details.player_id=${playerId}

    
  `
  const playerDetailsArray = await dbConnection.all(query)
  response.send(
    playerDetailsArray.map(eachplayer => convertMatchDetailsObject(eachplayer)),
  )
})

//API 6
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params

  const query = `
     select * 
     from 
     (player_details 
     INNER JOIN 
     player_match_score 
     ON player_details.player_id =player_match_score.player_id) as t 
     INNER JOIN 
     match_details 
     ON t.match_id =match_details.match_id 
     WHERE match_details.match_id=${matchId}
  `
  const Array = await dbConnection.all(query)
  response.send(
    Array.map(eachplayer => convertsPlayerDetailsObject(eachplayer)),
  )
})

//API 7

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params

  const query = `
  select 
  player_details.player_id as playerId,
  player_details.player_name as playerName,
  SUM(score) as totalScore,
  SUM(fours) as totalFours,
  SUM(sixes) as totalSixes

  from player_details 
  INNER JOIN 
  player_match_score
  ON player_details.player_id=player_match_score.player_id

  WHERE player_details.player_id=${playerId} 
  
  
  `
  const player = await dbConnection.get(query)

  response.send(player)
})
module.exports = app
