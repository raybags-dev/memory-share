import { LOGIN_HTML } from '../pages/login.js'
import { MAIN_PAGE } from '../pages/main_container.js'

//Initializer
export async function INITIALIZE_APP () {
  const email = JSON.parse(sessionStorage.getItem('token'))?.email
  const token = JSON.parse(sessionStorage.getItem('token'))?.token
  try {
    if (email && token) return await MAIN_PAGE()
    LOGIN_HTML()
  } catch (error) {
    console.log(error.message)
  }
}
