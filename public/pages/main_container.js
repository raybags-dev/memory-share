import { PaginateData } from '../lifters/works.js'
import {
  API_CLIENT,
  runSpinner,
  Notify,
  fetchData,
  searchDatabase,
  downloadImageById,
  displayLabel
} from '../lifters/works.js'
import { DisplayUserProfileHTML, generateSubCards } from '../components/card.js'
import { CARD, DisplayeBigImage } from '../components/card.js'
import { logOutUser, LOGIN_HTML } from '../pages/login.js'

export async function MAIN_PAGE () {
  let pageContent = `
      <nav  class="navbar navbar-expand-lg navbar-dark glassy" style="background-color: transparent;">
      <div class="container container-fluid img__conta">
      </div>
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
                  <a class="dropdown-item  dropdown-item-dark text-white bg-transparent user_profile_link"href="#">Account</a>
                </li>
                <li class="nav-item dropdown">
                  <a class="dropdown-item  dropdown-item-dark text-white bg-transparent logoutuser_link" href="#">Logout</a>
                </li>
              </ul>
            <form class="d-flex" style="max-height:inherit !important">
              <input id="search____input" class="form-control me-2" autocomplete="off" type="search" placeholder="Search" aria-label="Search">
            </form>
          </div>
        </div>
      </nav>
      <main id="main__wrapper" class="container my-10 position-relative">
              <form id="upload_formm" class="select-img-form text-danger">
              <label class="label">
                <input id="file_input" class="select-image-input" type="file" ref="inputRef" multiple>
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
  await genCardCarucel()
  let mySearchTimeout = null
  let searchInput = document.querySelector('#search____input')

  // ***********
  // document
  //   .querySelector('.select-image-input')
  //   .addEventListener('change', function (event) {
  //     const selectedFiles = event.target.files
  //     const imageDescriptionsContainer = document.querySelector(
  //       '.image-descriptions'
  //     )

  //     // Clear existing content
  //     imageDescriptionsContainer.innerHTML = ''

  //     if (selectedFiles.length > 0) {
  //       imageDescriptionsContainer.style.display = 'block'
  //     } else {
  //       imageDescriptionsContainer.style.display = 'none'
  //     }

  //     for (let i = 0; i < selectedFiles.length; i++) {
  //       const descriptionInput = document.createElement('input')
  //       descriptionInput.type = 'text'
  //       descriptionInput.placeholder = `Description for Image ${i + 1}`
  //       descriptionInput.name = `imageDescription${i + 1}`

  //       imageDescriptionsContainer.appendChild(descriptionInput)
  //     }
  //   })

  // ***********
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
  searchInput?.addEventListener('input', debounceSearchDatabase)
  // hideUploadForm(true)
  const logoutLink = document.querySelector('.logoutuser_link')
  logoutLink?.addEventListener('click', async () => {
    logOutUser(true)
  })
  const userProfileLink = document.querySelector('.user_profile_link')
  userProfileLink?.addEventListener('click', async () => {
    // await hideUploadForm(false)
    await DisplayUserProfileHTML()
  })
  await setUpBackToTop()
  await animateImages()
  let cardContainerr = document.querySelector('#off__Container')
  cardContainerr?.addEventListener('click', async function (event) {
    const isCard = event.target.classList.contains('card')
    const isImg = event.target.classList.contains('card-img-top')
    const isTrashCan = event.target.classList.contains('fa-trash-can')
    const isDownloadBtn = event.target.classList.contains('download-btn')

    if ((isImg || isCard) && !isTrashCan && !isDownloadBtn) {
      const cardElement = event.target.closest('.sm-card')
      if (cardElement) {
        const dataId = cardElement.getAttribute('data-id')
        const imgElement = cardElement.querySelector('.card-img-top')
        const imgSrc = imgElement ? imgElement.getAttribute('src') : null
        const ulElement = cardElement.querySelector('.card-body ul')
        const createdAt = ulElement?.querySelector('.creat_at')?.textContent
        await DisplayeBigImage(dataId, imgSrc, createdAt)

        //call elemnet to create all cards.
        Array.from(document.querySelectorAll('.main___card')).forEach(
          async (card, index) => {
            const cardDataId = card.getAttribute('data-card')
            const imgElement = card.querySelector('.card-img-top')
            const imgSrc = imgElement ? imgElement.getAttribute('src') : null
            const ulElement = card.querySelector('.card-body ul')
            const createdAt = ulElement?.querySelector('.creat_at')?.textContent
            await generateSubCards(cardDataId, imgSrc, createdAt)
          }
        )
      }
    }
  })
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
        const _id = liElements[9]?.textContent
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
      displayLabel([
        'main__wrapper',
        'alert-warning',
        'The current session has expired.'
      ])
      return Notify('Session terminated. Login required!')
    }
    if (!files || files.length === 0) {
      displayLabel([
        'main__wrapper',
        'alert-warning',
        'You must select a file to upload.'
      ])
      return Notify('Something went wrong.')
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
      displayLabel([
        'main__wrapper',
        'alert-success',
        'File uploaded successfully'
      ])

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
      return displayLabel([
        'main__wrapper',
        'alert-danger',
        'Max limit for test account reached.'
      ])
    if (error.response && error.response.status == 428)
      return displayLabel([
        'main__wrapper',
        'alert-danger',
        'Limit reached for a demo account!.'
      ])

    if (error instanceof TypeError)
      return displayLabel([
        'main__wrapper',
        'alert-danger',
        'Sorry an error occured try again later.'
      ])

    if (error.response.status === 409) {
      displayLabel(['main__wrapper', 'alert-danger', 'Duplicates detected!'])
      setTimeout(() => location.reload(), 1500)
      return
    }
    if (error instanceof TypeError && error.message.includes('token')) {
      Notify('Your session has expired. Please login!')
      displayLabel([
        'main__wrapper',
        'alert-warning',
        'Your session has expired. Please login!'
      ])
      await LOGIN_HTML()
    }
    if (error?.response.status == 401)
      return displayLabel([
        'main__wrapper',
        'alert-warning',
        'Your session has expired. Please login!'
      ])

    console.log('Something went wrong: ' + error)
  } finally {
    runSpinner(true)
  }
}
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
      backToTopButton.classList.add('show-to-top-btn')
    } else {
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
    backToTopButton.classList.remove('show-to-top-btn')
  }
}
export async function animateImages () {
  let imageDataArray = await extractImageUrls()
  if (!imageDataArray.length) return

  const container = document.querySelector('.img__conta')
  let currentIndex = 0

  const loadImage = async () => {
    const newImageDataArray = await extractImageUrls()
    if (JSON.stringify(newImageDataArray) !== JSON.stringify(imageDataArray)) {
      imageDataArray = newImageDataArray
      container.innerHTML = '' // Clear the container
    }

    if (imageDataArray.length === 0) return
    if (currentIndex >= imageDataArray.length) currentIndex = 0

    const imageUrl = imageDataArray[currentIndex]

    if (!imageUrl || imageUrl.trim() === 'null') {
      imageUrl = '../images/bg-water.jpeg'
    }

    const existingImage = container.querySelector(`img[src="${imageUrl}"]`)

    if (existingImage) existingImage.remove()

    const img = document.createElement('img')
    img.src = imageUrl
    img.classList.add('d-block', 'w-100', 'img-fluid', 'in_image_anime')

    container?.append(img)

    setTimeout(() => {
      img.remove()
      currentIndex++
      loadImage()
    }, 4000)
  }

  loadImage()
}
export async function extractImageUrls () {
  const cards = document.querySelectorAll('#off__Container .sm-card')
  const urls = []

  if (!cards.length) return urls

  cards.forEach(card => {
    const img = card.querySelector('.img-container img')
    if (img) {
      const imageUrl = img.getAttribute('src')
      urls.push(imageUrl)
    }
  })

  const mutationObserver = new MutationObserver(() => {
    refreshImageUrls()
  })

  mutationObserver.observe(document.getElementById('off__Container'), {
    childList: true,
    subtree: true
  })
  function refreshImageUrls () {
    const updatedUrls = []
    cards.forEach(card => {
      const img = card.querySelector('.img-container img')
      if (img) {
        const imageUrl = img.getAttribute('src')
        updatedUrls.push(imageUrl)
      }
    })
  }

  return urls
}
