import { PaginateData } from '../lifters/works.js'
import {
  API_CLIENT,
  runSpinner,
  Notify,
  fetchData,
  searchDatabase,
  downloadImageById
} from '../lifters/works.js'
import { DisplayeBigImage, DisplayUserProfileHTML } from '../components/card.js'
import { CARD } from '../components/card.js'
import { logOutUser, LOGIN_HTML } from '../pages/login.js'

export async function MAIN_PAGE () {
  let pageContent = `
      <nav class="navbar navbar-expand-lg navbar-dark glassy" style="background-color: #1b1a1ab3;">
        <div class="container-fluid">
          <a class="navbar-brand" href="https://raybags.herokuapp.com" title="see portifolio" target="_blank">
          <img src="../images/logo.png" alt="" width="40" height="40" style="border-radius:50%;">
          </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarScroll" aria-controls="navbarScroll" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse bg-transparent" id="navbarScroll">
              <ul class="navbar-nav me-auto my-2 my-lg-0 navbar-nav-scroll bg-transparent" style="--bs-scroll-height: 100px;">
                <li class="nav-item dropdown">
                  <a class="dropdown-item dropdown-item-dark text-white bg-transparent user_profile_link"href="#">Account</a>
                </li>
                <li class="nav-item dropdown">
                  <a class="dropdown-item dropdown-item-dark text-white bg-transparent logoutuser_link" href="#">Logout</a>
                </li>
              </ul>
            <form class="d-flex" style="max-height:inherit !important">
              <input id="search____input" class="form-control me-2" autocomplete="off" type="search" placeholder="Search" aria-label="Search">
            </form>
          </div>
        </div>
      </nav>
      <main id="main__wrapper" class="container my-10 position-relative">
          <form id="upload_formm" class="select-img-form text-danger hide">
            <label class="label">
              <input  class="select-image-input" type="file" ref="inputRef" multiple>
              <span>+</span>
            </label>
          </form>
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

  // logout user
  const logoutLink = document.querySelector('.logoutuser_link')
  logoutLink?.addEventListener('click', async () => {
    logOutUser(true)
  })
  // display user profile big carucel
  const userProfileLink = document.querySelector('.user_profile_link')
  userProfileLink?.addEventListener('click', async () => {
    await hideUploadForm(false)
    await DisplayUserProfileHTML()
  })
  await setUpBackToTop()
}
export async function genCardCarucel () {
  try {
    const cardContainer = document.querySelector('#off__Container')
    cardContainer?.addEventListener('click', async e => {
      //Handle file download
      const isDownloadBtnClicked = e.target.classList.contains('download-btn')
      if (isDownloadBtnClicked) {
        let imageId = e.target.id

        return imageId
          ? await downloadImageById(imageId)
          : Notify(
              'Something went wrong. Image could not be downloaded, please try again later!'
            )
      }
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
  } catch (e) {
    console.log('Error from genCardCarucel: ' + e.message)
  }
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
    if (error.response && error.response.status == 429)
      return Notify('Max limit upload for demo account reached!')

    if (error.response && error.response.status == 428)
      return Notify('Document selection not allowed for a demo account!')

    if (error instanceof TypeError)
      return Notify('Sorry, an error occurred while processing your request.')

    if (error.response.status === 409) {
      Notify(`Duplicates detected.`)
      setTimeout(() => location.reload(), 1500)
      return
    }
    if (error instanceof TypeError && error.message.includes('token')) {
      Notify('Your session has expired. Please login!')
      await LOGIN_HTML()
    }
    if (error?.response.status == 401)
      return Notify('Session expired. Please login!')

    console.log('Something went wrong: ' + error)
  } finally {
    runSpinner(true)
  }
}
// hide/show upload btn
export async function hideUploadForm (isVisible) {
  let form = document.getElementById('upload_formm')
  if (!isVisible) return form?.classList.add('hide')

  form?.classList.remove('hide')
}

export async function setUpBackToTop () {
  const buttonTopInnerHTML = `<a href="#" class="back-to-top" aria-label="Back to Top">&uarr;</a>`

  const mainContainer = document.getElementById('off__Container')
  mainContainer?.insertAdjacentHTML('beforeend', buttonTopInnerHTML)

  const backToTopButton = document.querySelector('.back-to-top')

  mainContainer?.addEventListener('scroll', function () {
    if (mainContainer.scrollTop > 0) {
      //backToTopButton.style.display = 'block'
      backToTopButton.classList.add('show-to-top-btn')
    } else {
      //backToTopButton.style.display = 'none'
      backToTopButton.classList.remove('show-to-top-btn')
    }
  })

  backToTopButton.addEventListener('click', function (e) {
    e.preventDefault()
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  if (mainContainer && mainContainer.innerHTML.trim() === '') {
    //backToTopButton.style.display = 'none'
    backToTopButton.classList.remove('show-to-top-btn')
  }
}
