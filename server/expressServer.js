import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import path from 'path'
import { getSessionToken } from '../utils/cookieUtils.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function setupExpressServer(store, app, createMainWindow, loginWindow) {
  const expressApp = express()
  const port = 53340

  setupMiddleware(expressApp)
  setupRoutes(expressApp, store, app, createMainWindow, loginWindow)

  return expressApp.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`)
  })
}

function setupMiddleware(expressApp) {
  expressApp.use(bodyParser.json())
  expressApp.use(cors())
  expressApp.use(express.static(path.join(__dirname, '../public')))
}

function setupRoutes(expressApp, store, app, createMainWindow, loginWindow) {
  expressApp.post(
    '/login/cookies',
    handleLoginCookies(store, app, createMainWindow, loginWindow)
  )
}

function handleLoginCookies(store, app, createMainWindow, loginWindow) {
  return (req, res) => {
    console.log('LOGIN Received cookies:', req.body)
    const { cookies } = req.body
    const session_token = getSessionToken(cookies)
    console.log(
      'Received cookies:',
      cookies,
      'and session token:',
      session_token
    )

    if (cookies && session_token) {
      storeCookiesAndToken(store, cookies, session_token)
      res.send(
        'Your Kick account has been successfully connected to Kichat. You can now open Kichat.'
      )
      handleSuccessfulLogin(app, loginWindow, createMainWindow)
    } else {
      res.status(400).send('No cookies provided.')
      console.log('No cookies provided.')
    }
  }
}

function storeCookiesAndToken(store, cookies, session_token) {
  store.set('cookies', cookies)
  store.set('session_token', session_token)
  console.log('Cookies stored.', cookies, session_token)
}

function handleSuccessfulLogin(app, loginWindow, createMainWindow) {
  if (global.mainWindow) {
    app.relaunch()
    app.exit()
  } else if (loginWindow) {
    loginWindow.close()
    global.mainWindow = createMainWindow()
  }
}
