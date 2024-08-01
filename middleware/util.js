import open from 'open'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import util from 'util'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMP_FILE_PATH = path.join(__dirname, '../.tmp/browser.tmp')
const execPromise = util.promisify(exec)

export function isBrowserOpened () {
  try {
    return fs.existsSync(TEMP_FILE_PATH)
  } catch (err) {
    console.error('Error checking browser state file:', err)
    return false
  }
}

export function setBrowserOpened () {
  try {
    fs.writeFileSync(TEMP_FILE_PATH, 'opened')
  } catch (err) {
    console.error('Error setting browser state file:', err)
  }
}

export async function openBrowser (PORT) {
  try {
    if (!isBrowserOpened()) {
      await open(`http://localhost:${PORT}`)
      setBrowserOpened()
    }
  } catch (err) {
    console.error('Error opening the browser:', err)
  }
}

export function resetBrowserOpenedFlag () {
  try {
    if (fs.existsSync(TEMP_FILE_PATH)) {
      fs.unlinkSync(TEMP_FILE_PATH)
    }
  } catch (err) {
    console.error('Error removing browser state file:', err)
  }
}

export function cleanUpAndExit () {
  resetBrowserOpenedFlag()
  process.exit()
}

export async function clearDevPort (port) {
  try {
    const { stdout, stderr } = await execPromise(`lsof -ti:${port}`)
    if (stderr) throw new Error(stderr)

    const pidList = stdout.split('\n').filter(Boolean)
    if (pidList.length) {
      for (const pid of pidList) {
        await execPromise(`kill -9 ${pid}`)
        console.log(`Killed process with PID ${pid} on port ${port}`)
      }
    }
  } catch (error) {
    console.error(`Error checking or killing port ${port}:`, error.message)
  }
}
