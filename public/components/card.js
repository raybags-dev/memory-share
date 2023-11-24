import {
  formatEmail,
  formatDate,
  runSpinner,
  API_CLIENT,
  Notify,
  fetchUserProfile,
  deleteUserDocuments,
  deleteUserProf,
  displayLabel,
  saveToLocalStorage,
  fetchFromLocalStorage
} from '../lifters/works.js'
async function CARD (data, isNew = false) {
  const {
    url,
    signature,
    updatedAt,
    createdAt,
    user,
    _id,
    filename,
    originalname,
    description
  } = await data
  const { email } = JSON.parse(sessionStorage.getItem('token'))
  let fall_back = '../images/_404_.jpeg'
  let cardContent = `
  <div class="col sm-card bg-transparent" style="padding:.2rem;" data-id="${_id}">
  <div class="card fade-card main___card  bg-transparent rounded" style="object-fit:contain !important;" data-card="${_id}">
    <div class="main-del-cont" style="cursor:pointer !important;z-index:1000 !important;">
    <i id="de__btn_1" class="fa-regular fa-trash-can"></i>
    </div>
      <i id="${_id}" class="fa-solid fa-download download-btn ${_id}"></i>
  <div class="skeleton"></div>
  <div class="img-container" style="width:100% !important;object-fit:cover !important;">
        <img src="${
          `${url}?${signature}` || ''
        }" class="card-img-top  border-dark img-fluid hide_2 img_card ${_id}" loading="lazy" alt="..." onload="this.classList.remove('hide_2')" onerror="this.onerror=null;this.src='${fall_back}'">
  </div>
  <div class="card-footer bg-transparent card-img-overlay text-danger m-1 rounded" style="width:fit-content;height:fit-content;padding:.3rem; font-style:italic">${formatDate(
    createdAt
  )}</div>
    <div class="card-body text-white">
      <div class="container img__desc">${description || ''}</div>
      <ul class="list-group rounded d-none">
        <li class="list-group-item bg-transparent name">${formatEmail(
          email
        )}</li>
        <li class="list-group-item bg-transparent text-white">${user}</li>
        <li class="list-group-item bg-transparent text-white">${originalname}</li>
        <li class="list-group-item bg-transparent text-white file_n">${filename}</li>
        <li class="list-group-item bg-transparent text-white creat_at">${createdAt}</li>
        <li class="list-group-item bg-transparent text-white">${updatedAt}</li>
        <li class="list-group-item bg-transparent text-white user__id">${_id}</li>
      </ul>
    </div>
  </div>
</div>
  `
  const offContainer = document.querySelector('#off__Container')
  if (isNew) {
    offContainer?.insertAdjacentHTML('afterbegin', cardContent)
  } else {
    offContainer?.insertAdjacentHTML('beforeend', cardContent)
  }
  // remove skeleton after image is loaded
  runSkeleto(document.querySelector('.card .img-container img') !== null)
}
export async function runSkeleto (isDone) {
  if (isDone) {
    let cards = document.querySelectorAll('.col')
    cards.forEach((card, index) => {
      let image = card.querySelector('img')
      if (image.complete) {
        let skeleton = card.querySelector('.skeleton')
        setTimeout(() => skeleton.classList.add('hide'), 800)
      } else {
        image.addEventListener('load', () => {
          let skeleton = card.querySelector('.skeleton')
          setTimeout(() => skeleton.classList.add('hide'), 800)
        })
      }
    })
  }
}
export async function DisplayeBigImage (dataId, imgSrc, createdAt, description) {
  const innerBodyBig = `
        <div id="carouselExampleCaptions" class="carousel carucel___main slide" data-big="${dataId}">
        <div class="carousel-indicators">
          <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
        </div>
        <div class="carousel-inner sub_bigContainer">
              <div class="carousel-item active" data-image-id="${dataId}">
                <img src="${imgSrc}" class="d-block big__image w-100" alt="...">
                <div class="carousel-caption d-none d-md-block" style=";position:fixed;top:10%;left:10%;width:max-content;height:max-content;transform:translate(-50%,-50%);z-index:4000;">
                <p style="padding:.4rem;border-radius:.4rem;text-shadow:1px 1px 1px black;backdrop-filter:blur(5px);background-color:#53535333;">${formatDate(
                  createdAt
                )}</p>
                </div>
              </div>
        </div>
        <div class="description_cont">${description}</div>
        <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Next</span>
        </button>
        <span class="close_bigimg_caru">&#9747;</span>
      </div>`

  const container__main_body = document.getElementById('off__Container')
  container__main_body?.insertAdjacentHTML('afterbegin', innerBodyBig)
  // finished appending remove spinner
  setTimeout(() => runSpinner(true), 100)

  // remove carousel when close btn clicked
  const closeButton = document.querySelector('.close_bigimg_caru')
  closeButton?.addEventListener('click', async event => {
    event.stopPropagation()
    const carouselElement = document.querySelector('.carucel___main')
    container__main_body?.removeChild(carouselElement)
  })

  // const carouselElement = document.querySelector('.carucel___main')
  // if (carouselElement) {
  //   carouselElement.addEventListener('slid.bs.carousel', event => {
  //     const activeSlide = event.relatedTarget
  //     const descriptionCont = document.querySelector('.description_cont')
  //     if (descriptionCont && activeSlide) {
  //       const dataId = activeSlide.getAttribute('data-image-id')
  //       const cardElement = document.querySelector(
  //         `.sm-card[data-id="${dataId}"]`
  //       )
  //       const desc = cardElement?.querySelector('.img__desc')?.textContent
  //       descriptionCont.textContent = desc
  //     }
  //   })
  // }
  const carouselElement = document.querySelector('.carucel___main')
  if (carouselElement) {
    carouselElement.addEventListener('slid.bs.carousel', event => {
      const activeSlide = event.relatedTarget
      const descriptionCont = document.querySelector('.description_cont')
      if (descriptionCont && activeSlide) {
        const dataId = activeSlide.getAttribute('data-image-id')
        const cardElement = document.querySelector(
          `.sm-card[data-id="${dataId}"]`
        )
        const descContainer = cardElement?.querySelector('.img__desc')
        const desc = descContainer?.textContent || 'Not provided' // Default value if no description
        descriptionCont.textContent = desc
      }
    })
  }
}
export function removeElementFromDOM (elementAnchor) {
  if (document.contains(elementAnchor)) {
    elementAnchor.remove()
  }
}
export async function deleteDocument (documentId = '') {
  if (!documentId) return
  try {
    const { token } = JSON.parse(sessionStorage.getItem('token'))
    if (!token) {
      return displayLabel([
        'main__wrapper',
        'alert-danger',
        'Session expired! Login required!'
      ])
    }
    await Notify('Deleting document...')
    let colElem = [...document.querySelectorAll('.col')].find(
      card => card.dataset.id === documentId
    )
    let docId = colElem?.dataset.id
    await IsProcessRunning(true, docId)

    setTimeout(async () => {
      let url = `delete-doc/${docId}`
      const response = await API_CLIENT.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.status === 200) {
        await IsProcessRunning(false, docId)

        colElem.classList.add('del_effect')
        // remove the card from the DOM
        setTimeout(() => colElem.remove(), 500)
        displayLabel([
          'main__wrapper',
          'alert-success',
          'Success: Selected document deleted!'
        ])
        await Notify('done')
        return
      }
    }, 500)
  } catch (error) {
    if (error instanceof TypeError) {
      return displayLabel([
        'main__wrapper',
        'alert-danger',
        'Sorry, an error occurred while processing your request.'
      ])
    }
  } finally {
    await runSpinner(true)
  }
}
export async function DisplayUserProfileHTML () {
  document.querySelector('#carocel_big')?.remove()
  document.querySelector('#uploadForm')?.remove()
  let profile_object = await fetchUserProfile()
  if (profile_object === null || profile_object === undefined) {
    runSpinner(false, 'Failed!')
    displayLabel([
      'main__wrapper',
      'alert-danger',
      'There seems to be an issue with your profile account.'
    ])
    return setTimeout(() => runSpinner(true), 5000)
  }

  const {
    _id: id,
    name,
    email,
    createdAt,
    updatedAt,
    DocumentCount: count
  } = profile_object
  runSpinner(false, 'Fetching...')
  const innerBodyBig = `
      <div id="carocel_big" class="container control_big_cont" style="z-index: 200;">
      <div class="container">
        <div class="del_btn_cont">
          <span class="lead text-danger">&#10006;</span>
        </div>
            <ul class="list-group prof-bad text-white" style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:100%;height:auto;">
                <li class="list-group-item bg-transparent text-light">Name: ${
                  (email && formatEmail(email)) || 'value'
                }</li>
                <li class="list-group-item bg-transparent text-light" data-pro-id="${id}">ID: ${
    id || 'id'
  }</li>
                <li class="list-group-item bg-transparent text-light">Email: ${
                  (email && email) || 'value'
                }</li>
                <li class="list-group-item bg-transparent text-light">Created: ${
                  (createdAt && createdAt) || 'value'
                }</li>
                <li class="list-group-item bg-transparent text-light">Updated: ${
                  (updatedAt && updatedAt) || 'value'
                }</li>
                <li class="list-group-item bg-transparent text-light">Document total: ${
                  (count && count) || 0
                }</li>
                <div class="text-white border-transparent d-grid gap-2  p-3">
                  <a href="#" class="btn del_all_docs btn-lg bg-transparent btn-danger text-white">Delete documents</a>
                  <a href="#" class="btn del_profile btn-lg bg-transparent btn-danger text-white float-end">Delete profile</a>
                </div>
            </ul>
      </div>
    </div>`

  const container = document.querySelector('#off__Container')

  container?.insertAdjacentHTML('afterbegin', innerBodyBig)
  // finished appending remove spinner
  setTimeout(() => runSpinner(true), 100)

  const closeButton = document.querySelector('.del_btn_cont .lead')
  closeButton?.addEventListener('click', async () => {
    container?.removeChild(document.getElementById('carocel_big'))
  })
  let IMGCONT = document.querySelector('#carocel_big')
  IMGCONT.addEventListener('click', function (event) {
    if (!IMGCONT.contains(event.target)) {
      removeElementFromDOM(IMGCONT)
    }
  })

  //delete all user docs
  let deleteUserProfile = document.querySelector('.del_profile')
  deleteUserProfile?.addEventListener('click', async () => {
    await deleteUserProf()
  })
  //delete all user docs
  let deleleteAllDocs = document.querySelector('.del_all_docs')
  deleleteAllDocs?.addEventListener('click', async () => {
    await deleteUserDocuments()
  })
}
export async function userGuideModel () {
  const userGuideServiceModal = `
      <button type="button" class="btn btn-sm modaal_cont position-absolute"  data-bs-toggle="modal" data-bs-target="#exampleModal">
      </button>
      <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable">
          <div class="modal-content bg-transparent text-light" style="backdrop-filter:blur(20px);border:2px solid #13283b80;">
            <div class="modal-header text-white" style="background: #13283b80;">
              <h5 class="modal-title" id="exampleModalLabel">How it works</h5>
              <button type="button" class="btn-close text-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body text-light" style="background-color: #13283b80;">
              <ul style="opacity:0.5;">
                <li>Sign up: Start by creating an account with your email address and password. This will grant you access to this application.</li>
                <li>Once account is created, you'll be logged in automatically. Once you're logged in, you can easily upload your documents. Simply click on the 'Upload' button and select the file you wish to upload. This application supports various file formats, including 'PDF', 'jpeg', 'jpg', 'png', 'gif', 'pdf', 'webp' and 'avif'. Please note, for demo accounts, a maximum of 5 files can be uploaded at a time. </li>
               <li>Manage Documents: After uploading your documents, you can manage them efficiently. You can view a list of all your uploaded documents, search for specific documents, see all document count in your account delete your account or delete entire document catalogue.</li>
                <li>Document Security: We prioritize the security and privacy of your documents. All documents are stored securely using encryption techniques, and access to your documents is protected with user authentication and authorization. Only you can see, modify, and or delete your documents. </li>
               <li>Mobile Accessibility: Access your documents on the go! Our application is fully responsive and accessible on mobile devices, allowing you to manage your documents from anywhere, anytime.</li>
                </ul>
            </div>
            <div class="modal-footer" style="border:2px solid #13283b80;background-color: #13283b80;">
              <button type="button" class="btn text-success  bg-transparent btn-lg" style="border: 2px solid #13283b80;" data-bs-dismiss="modal">Close Modal</button>
            </div>
          </div>
        </div>
      </div>
    `
  //check if guide has been shown already
  const userGuideShown = await fetchFromLocalStorage('userGuideShown')
  if (!userGuideShown) {
    const container = document.getElementById('innerBody')
    container?.insertAdjacentHTML('afterbegin', userGuideServiceModal)
    setTimeout(async () => {
      const modal_btn = document.querySelector('.modaal_cont')
      modal_btn?.click()
    }, 2000)
    saveToLocalStorage('userGuideShown', true)
  }
}
export async function IsProcessRunning (isRunning, id) {
  const cardSelector = `[data-id="${id}"]`
  const existingLoader = document.querySelector(
    `${cardSelector} .doc_delete_loader`
  )

  if (isRunning) {
    if (!existingLoader) {
      const loader = document.createElement('span')
      loader.classList.add('doc_delete_loader')

      // Find the main___card element
      const mainCard = document.querySelector(cardSelector)

      if (mainCard) {
        mainCard
          .querySelector('.main-del-cont')
          ?.insertAdjacentElement('afterend', loader)
      }
    }
  } else {
    if (existingLoader) {
      existingLoader.remove()
    }
  }
}
document.addEventListener('DOMContentLoaded', function () {
  ;(async function () {
    try {
      document.addEventListener('click', async function (event) {
        const target = event.target

        // Check if the clicked element has the class 'main-del-cont'
        if (target.classList.contains('fa-trash-can')) {
          const parentCard = target.closest('.sm-card')
          // If parent card is found, extract the data-id attribute
          if (parentCard) {
            const docId = parentCard.dataset.id
            await deleteDocument(docId)
          }
        }
      })
    } catch (e) {
      console.log(e.message)
    }
  })()
})
export async function generateSubCards (dataId, imgSrc, createdAt) {
  let f_bk = '../images/_404_.jpeg'
  const subCarouselCard = `
    <div class="carousel-item" data-image-id="${dataId}">
        <img src="${imgSrc || f_bk}" class="d-block big__image w-100" alt="...">
        <div class="carousel-caption d-none d-md-block" style=";position:fixed;top:10%;left:10%;width:max-content;height:max-content;transform:translate(-50%,-50%);z-index:4000;">
          <p style="padding:.4rem;border-radius:.4rem;text-shadow:1px 1px 1px black;backdrop-filter:blur(5px);background-color:#53535333;">${formatDate(
            createdAt
          )}</p>
        </div>
      </div>`

  try {
    const subcardContainer = document.querySelector('.sub_bigContainer')
    subcardContainer?.insertAdjacentHTML('beforeend', subCarouselCard)

    // Update the carousel using Bootstrap's Carousel methods
    const carouselElement = document.querySelector('.carucel___main .carousel')
    bootstrap.Carousel.getInstance(carouselElement)

    // Create a new indicator button
    const indicatorContainer = document.querySelector(
      '.carucel___main .carousel-indicators'
    )
    const newIndicator = document.createElement('button')
    newIndicator.type = 'button'
    newIndicator.setAttribute('data-bs-target', '.carucel___main .carousel')
    newIndicator.setAttribute(
      'data-bs-slide-to',
      subcardContainer.children.length - 1
    )
    newIndicator.setAttribute(
      'aria-label',
      `Slide ${subcardContainer.children.length}`
    )

    // Add the new indicator to the container
    indicatorContainer?.appendChild(newIndicator)
  } catch (e) {
    console.log(e.message)
  }
}
export async function addCardWithDelay (obj, isNew = false, delay = 150) {
  await new Promise(resolve => setTimeout(resolve, delay))
  await CARD(obj, isNew)
}
