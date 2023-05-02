import { LOGIN_HTML, LogoutBtnIsVisible } from '../pages/login.js'
import { SIGNUP_HTML } from '../pages/signup.js'
import { CARD } from '../components/card.js'

// api client
export const API_CLIENT = axios.create({
  baseURL: '/raybags/v1/',
  timeout: 150000
})
API_CLIENT.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401 && data.error === 'Invalid token') {
        // Redirect to login page
        sessionStorage.removeItem('token')
        LOGIN_HTML()
      }
    }
    return Promise.reject(error)
  }
)
// Notifications
export async function Notify (message = '...') {
  // Check if a notification already exists and remove it
  const existingNotification = document.getElementById('notifications')
  if (existingNotification) {
    existingNotification.remove()
  }
  // Create the new notification element
  const notification = document.createElement('div')
  notification.id = 'notifications'
  notification.className =
    'alert alert-transparent p-1 rounded showNotification'
  notification.setAttribute('role', 'alert')
  notification.style.cssText =
    'min-width:fit-content;font-size:0.7rem;font-style:italic;'
  // Create the message element and add it to the notification
  const messageElement = document.createElement('p')
  messageElement.style.color = 'white'
  messageElement.innerText = message || 'Nothing to see...'
  notification.appendChild(messageElement)
  // Append the notification to the body
  document.body.appendChild(notification)
  // Wait 5 seconds and remove the showNotification class
  setTimeout(() => {
    notification.classList.remove('showNotification')
    // Wait for the animation to finish and remove the notification from the DOM
    setTimeout(() => {
      notification.remove()
    }, 500)
  }, 5000)
}
// Main page loader
export async function runSpinner (isDone, message = 'Processing...') {
  const loader = document.querySelector('#main-page-loader')
  if (!isDone) {
    if (!loader) {
      const loaderHTML = `
          <div id="main-page-loader" class="d-flex align-items-center text-white justify-content-center"
            style="position:fixed; top:0; left:0; right:0; bottom:0;z-index:3000">
            <div class="d-flex">
              <h3 class="fs-4" id="my_text" style="position:absolute;top:50%;opacity:.7;left:50%;transform:translate(-50%, -50%);">
                ${message}
              </h3>
              <span class="loader text-white" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);"></span>
            </div>
          </div>
        `
      const wrapper = document.querySelector('body')
      wrapper.insertAdjacentHTML('beforeend', loaderHTML)
    }
  } else {
    if (loader) {
      loader.remove()
    }
  }
}
export function formatDate (timestamp) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}-${hours}:${minutes}`
}
export function formatEmail (email) {
  const atIndex = email.indexOf('@')
  if (atIndex !== -1) {
    const username = email.slice(0, atIndex)
    const domain = email.slice(atIndex + 1)
    return `@${username}`
  }
  return ''
}
export async function fetchData (page = 1) {
  runSpinner(false, 'loading...')
  try {
    const { token } = JSON.parse(sessionStorage.getItem('token'))

    const baseUrl = '/uploader/paginated-user-documents'
    const perPage = 10
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const url = `${baseUrl}?page=${page}&perPage=${perPage}`

    const res = await API_CLIENT.post(url, {}, { headers })

    if (res.statusText == 'OK') {
      setTimeout(() => runSpinner(true), 500)
      const data = res.data.data || []
      if (data.length < perPage) {
        Notify(`Last page: ${page}`)
        return data
      } else {
        if (page == 1) Notify(``)
        Notify(`Page ${page} loaded`)
        return data
      }
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Notify('An error occurred while processing your request. Please login!')
      setTimeout(async () => {
        LogoutBtnIsVisible(false)
        return await LOGIN_HTML()
      }, 2000)
    }
    if (
      error?.response.data == 'Sorry I have nothing for you!' ||
      error?.response.status == 404
    ) {
      runSpinner(true)
      return Notify('You dont have any saved documents.')
    }
    if (error?.response.status == 401) {
      Notify('Session expired. Please login!')
      document.getElementById('log___out').style.display = 'none'
      return LOGIN_HTML()
    }
    if (error?.response.status == 404) {
      showNotification('Account not found. Please sign up!')
      SIGNUP_HTML()
      return
    }
    console.log(error.message)
  } finally {
    runSpinner(true)
  }
}
export async function PaginateData () {
  runSpinner(false)
  let page = 1
  const container = document.getElementById('off__Container')

  if (!container) return
  const sessionToken = sessionStorage.getItem('token')
  if (!sessionToken) return

  try {
    const data = await fetchData(page)
    if (data && data.length) {
      data.forEach(async obj => {
        try {
          await CARD(obj)
        } catch (e) {
          console.log(e)
        }
      })
      setTimeout(async () => {
        // Set up the intersection observer and start observing the second-to-last card
        let loading = false
        let target = container?.children[container.children.length - 2]
        const observer = new IntersectionObserver(
          async (entries, observer) => {
            const lastEntry = entries[entries.length - 1]
            // Load the next page when the observer is triggered
            if (lastEntry.isIntersecting && !loading) {
              loading = true
              const data = await fetchData(++page)
              if (data && data.length) {
                data.forEach(async obj => {
                  await CARD(obj)
                })

                if (data.length < 10) {
                  Notify(`Last page: ${page}`)
                  observer.unobserve(target)
                } else {
                  loading = false
                  // Remove the observer from the current target
                  observer.unobserve(target)
                  // Get the new target to observe
                  target = container.children[container.children.length - 2]
                  observer.observe(target)
                }
              }
            }
          },
          { rootMargin: '0px 0px 100% 0px' }
        )

        const responses = document.querySelectorAll('.card')
        if (responses && responses.length >= 10) {
          // Only start observing when there are at least 10 items on the first page
          observer.observe(target)
        }
      }, 1000)
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Notify('Sorry, an error occurred while processing your request.')
      LogoutBtnIsVisible(false)
      return await LOGIN_HTML()
    }
    console.warn(error.message)
  } finally {
    runSpinner(true)
  }
}
// search db
export async function searchDatabase () {
  const searchingInput = document.querySelector('#search____input')
  let inputValue = searchingInput?.value.trim().toLowerCase()

  try {
    runSpinner(false, 'Searching...')
    const { token } = JSON.parse(sessionStorage.getItem('token'))
    let url = '/uploader/user-docs'

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
    const res = await API_CLIENT.post(url, {}, { headers })

    if (res.statusText === 'OK') {
      runSpinner(true)
      const { documents: response } = await res.data
      let hasResults = false
      let matchingDocs = [] // array to store the matching search results

      response.forEach((obj, index) => {
        const { originalname, filename, createdAt } = obj
        const document_name = originalname.toLowerCase()

        if (inputValue === '' || document_name.includes(inputValue)) {
          if (originalname && filename && createdAt) {
            matchingDocs.push(obj) // add the matching result to the array
            hasResults = true
          } else {
            console.warn(
              `Document with ID ${obj._id} is missing one or more required properties.`
            )
          }
        } else {
          const card = document.querySelector(`[data-id="${obj._id}"]`)
          if (card) {
            card.classList.add('hide') // hide cards that don't match the search query
          }
        }
      })

      if (!inputValue) {
        // Make all the cards visible again if inputValue is empty
        const cards = document.querySelectorAll('.card.hide')
        cards.forEach(card => card.classList.remove('hide'))
      }
    }
  } catch (error) {
    console.log(error)
  } finally {
    runSpinner(true)
  }
}
