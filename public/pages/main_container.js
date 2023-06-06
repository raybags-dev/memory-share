import { PaginateData } from '../lifters/works.js'
import {
  API_CLIENT,
  runSpinner,
  Notify,
  fetchData,
  searchDatabase
} from '../lifters/works.js'
import { DisplayeBigImage } from '../components/card.js'
import { CARD } from '../components/card.js'
import { logOutUser, LogoutBtnIsVisible, LOGIN_HTML } from '../pages/login.js'

export async function MAIN_PAGE () {
  let pageContent = `
      <nav class="navbar navbar-expand-lg">
        <div class="container">
          <h2 class="text-light sticky-top heading">Memories</h2>
          <form class="d-flex search_db_form pt-2 hide" role="search">
            <input id="search____input" autocomplete="off" class="form-control me-2" type="search" placeholder="" aria-label="Search">
            <i class="fa-solid fa-magnifying-glass"></i>
          </form>
        </div>
      </nav>
      <main id="main__wrapper" class="container my-10 position-relative">
        <div class="container pb-3 sticky-top mt-1 off__Container">
          <form id="upload_formm" class="select-img-form text-danger sticky-top hide">
            <label class="label">
              <input class="select-image-input" type="file" ref="inputRef" multiple>
              <span>+</span>
            </label>
          </form>
        </div>
        <div id="off__Container" class="row row-cols-1 row-cols-md-3 g-2" style="transition:.5s !important;">
        </div>
      </main>
    `
  document.getElementById('innerBody').innerHTML = pageContent
  await PaginateData()
  const selectImgForm = document.querySelector('.select-img-form')
  selectImgForm?.addEventListener('change', uploadFiles)
  // generate card carucel
  await genCardCarucel()
  //   show logout button
  await LogoutBtnIsVisible(true)
  // handle db search
  let mySearchTimeout = null
  let searchInput = document.querySelector('#search____input')

  function debounceSearchDatabase (e) {
    if (e && e.preventDefault) e.preventDefault()
    clearTimeout(mySearchTimeout)

    mySearchTimeout = setTimeout(async () => {
      const inputValue = searchInput?.value.trim().toLowerCase()

      if (inputValue === '') {
        await PaginateData()
      } else {
        await searchDatabase()
      }
    }, 1000)
  }
  async function clearSearchInput () {
    searchInput.value = ''
    searchDatabase()
  }
  searchInput?.addEventListener('input', debounceSearchDatabase)
  hideUploadForm(true)
}
export async function genCardCarucel () {
  const cardContainer = document.querySelector('#off__Container')
  cardContainer?.addEventListener('click', async e => {
    const card = e.target.closest('.card')
    if (card) {
      const imgSrc = card.querySelector('img')?.getAttribute('src')
      const un_ordered_list = card.querySelector('.card-body ul')

      const liElements = un_ordered_list.querySelectorAll('li')
      const email = liElements[0]?.textContent
      const userId = liElements[1]?.textContent
      const originalName = liElements[2]?.textContent
      const fileName = liElements[3]?.textContent
      const size = liElements[4]?.textContent
      const encoding = liElements[5]?.textContent
      const createdAt = liElements[6]?.textContent
      const updatedAt = liElements[7]?.textContent
      const contentType = liElements[8]?.textContent
      const _id = liElements[9]?.textContent

      DisplayeBigImage(
        imgSrc,
        email,
        userId,
        originalName,
        fileName,
        size,
        encoding,
        createdAt,
        updatedAt,
        contentType,
        _id
      )
      hideUploadForm(false)
    }
  })
}
export async function uploadFiles () {
  runSpinner(false, 'Uploading...')
  try {
    const { token } = JSON.parse(sessionStorage.getItem('token'))
    const inputRef = document.querySelector('.select-image-input')
    const files = inputRef?.files

    if (!token || token === undefined) {
      return Notify('Session terminated. Login required!')
    }
    if (!files || files.length === 0) {
      return Notify('Please select files to upload')
    }
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i])
    }

    const response = await API_CLIENT.post('/uploader/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    if (response.statusText == 'OK') {
      runSpinner(true)
      Notify('Uploaded successful')

      let newData = await fetchData(1)
      let container = document.querySelector('#off__Container')
      let existingData = Array.from(container.children).map(
        child => child.dataset.id
      )

      newData.forEach(async obj => {
        try {
          if (!existingData.includes(obj._id)) {
            await CARD(obj, true)
          }
        } catch (e) {
          console.log(e.message)
        }
      })
    }
  } catch (error) {
    if (error instanceof TypeError) {
      Notify('Sorry, an error occurred while processing your request.')
      LogoutBtnIsVisible(false)
      return await LOGIN_HTML()
    }
    if (error.response.status === 409) {
      Notify(`Duplicates detected.`)
      setTimeout(() => location.reload(), 1500)
      return
    }
    if (error instanceof TypeError && error.message.includes('token')) {
      Notify('Your session has expired. Please login!')
      LogoutBtnIsVisible(false)
      await LOGIN_HTML()
    }
    if (error?.response.status == 401) {
      Notify('Session expired. Please login!')
      document.getElementById('log___out').style.display = 'none'
      return LOGIN_HTML()
    }

    console.log('Something went wrong: ' + error)
  } finally {
    runSpinner(true)
  }
}
// logout user
const logoutLink = document.querySelector('#logoutuser_link')
logoutLink?.addEventListener('click', async () => logOutUser(true))
// hide/show upload btn
export async function hideUploadForm (isVisible) {
  let form = document.getElementById('upload_formm')
  if (!isVisible) return form?.classList.add('hide')

  form?.classList.remove('hide')
}
