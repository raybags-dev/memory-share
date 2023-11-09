import {
  formatEmail,
  formatDate,
  runSpinner,
  API_CLIENT,
  Notify,
  fetchUserProfile,
  deleteUserDocuments,
  deleteUserProf
} from '../lifters/works.js'
import { hideUploadForm } from '../pages/main_container.js'
import { LOGIN_HTML } from '../pages/login.js'
export async function CARD (data, isNew = false) {
  const {
    url,
    signature,
    size,
    updatedAt,
    createdAt,
    user,
    _id,
    contentType,
    encoding,
    filename,
    originalname
  } = await data
  const { email } = JSON.parse(sessionStorage.getItem('token'))
  let fall_back = '../images/_404_.jpeg'
  let cardContent = `
  <div class="col sm-card bg-transparent" style="padding:.2rem;" data-id="${_id}">
  <div class="card  bg-transparent rounded" style="object-fit:contain !important;">
  <div class="skeleton"></div>
  <div class="img-container" style="width:100% !important;object-fit:cover !important;">
  <i id="${_id}" class="fa-solid fa-download download-btn ${_id}"></i>
        <img src="${
          `${url}?${signature}` || ''
        }" class="card-img-top  border-dark img-fluid hide_2 img_card ${_id}" loading="lazy" alt="..." onload="this.classList.remove('hide_2')" onerror="this.onerror=null;this.src='${fall_back}'">
  </div>
  <div class="card-footer bg-transparent card-img-overlay text-danger m-1 rounded" style="width:fit-content;height:fit-content;padding:.3rem; font-style:italic">${formatDate(
    createdAt
  )}</div>
    <div class="card-body text-white">
      <ul class="list-group rounded">
        <li class="list-group-item bg-transparent">${formatEmail(email)}</li>
        <li class="list-group-item bg-transparent text-white">${user}</li>
        <li class="list-group-item bg-transparent text-white">${originalname}</li>
        <li class="list-group-item bg-transparent text-white">${filename}</li>
        <li class="list-group-item bg-transparent text-white">${size}</li>
        <li class="list-group-item bg-transparent text-white">${encoding}</li>
        <li class="list-group-item bg-transparent text-white">${createdAt}</li>
        <li class="list-group-item bg-transparent text-white">${updatedAt}</li>
        <li class="list-group-item bg-transparent text-white">${contentType}</li>
        <li class="list-group-item bg-transparent text-white">${_id}</li>
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
          setTimeout(() => skeleton.classList.add('hide_2'), 800)
        })
      }
    })
  }
}
// big Carucel
export async function DisplayeBigImage (
  imgurl,
  email,
  userId,
  originalname,
  filename,
  size,
  encoding,
  createdAt,
  updaedAt,
  contenttype,
  _id
) {
  runSpinner(false, 'Fetching...')
  let fallback_img = '../images/_404_.jpeg'
  const innerBodyBig = `
    <div id="carocel_big" class="container control_big_cont" data-carucel="${
      _id && _id
    }" style="z-index:200">
    <div class="container __bigOne__">
    <div class="del_btn_cont">
    <span class="lead">&#10006;</span>
    </div>
    
    <div class="prev__btn">
    <span class="lead">&#10094;</span>
    </div>
    
    <div class="main-del-cont" style="cursor:pointer !important;z-index:1000 !important;">
    <i id="de__btn_1" class="fa-regular fa-trash-can"></i>
    </div>
    <div class="big_spinnerr hide_2">
    <span class="big_caro_loader"></span>
    </div>
    <div class="card big_box bg-transparent" data-user="${
      userId && userId
    }"  style="width:60%;height:70% !important">
        <div class="details_btn"><span>&#9737;</span></div>

          <img  src="${
            imgurl || ''
          }" class="card-img-top img-fluid" loading="lazy" alt="..." style="border-radius:.2rem;"  onerror="this.onerror=null;this.src='${fallback_img}'">
          <div id="description" class="card-body hide" style="z-index: 100;">
            <h5 class="card-title">${email && email}</h5>
            <hr>
            <p class="">Id: ${userId && userId}</p>
            <p class="">Original file: ${originalname && originalname}</p>
            <p class="">New file: ${filename && filename}</p>
            <p class=""> File size: ${size && size}</p>
            <p class="">Encoding type: ${encoding && encoding}</p>
            <p class="">Content type: ${contenttype && contenttype}</p>
            <p class="card-text"><small>Created: ${
              createdAt && createdAt
            }</small></p>
            <p class="card-text"><small>Updated: ${
              updaedAt && updaedAt
            }</small></p>
          </div>
        </div>
        <div class="next__btn">
        <span class="lead">&#10095;</span>
        </div>
      </div>
    </div>`

  const container = document.getElementById('innerBody')
  container?.insertAdjacentHTML('afterbegin', innerBodyBig)
  // finished appending remove spinner
  setTimeout(() => runSpinner(true), 100)

  const closeButton = document.querySelector('#carocel_big .lead')
  closeButton?.addEventListener('click', async () => {
    container?.removeChild(document.getElementById('carocel_big'))
    await hideUploadForm(true)
  })

  let IMGCONT = document.querySelector('#carocel_big')
  IMGCONT.addEventListener('click', function (event) {
    if (!IMGCONT.contains(event.target)) {
      removeElementFromDOM(IMGCONT)
    }
  })

  // delete document
  let btn = document.querySelector('.main-del-cont')
  btn?.addEventListener('click', async () => {
    Notify('Deleting document...')
    await deleteDocument(_id)
    await hideUploadForm(true)
  })

  document.querySelector('.details_btn')?.addEventListener('click', () => {
    document.querySelector('#description')?.classList.toggle('hide')
  })
  // remove big carucel
  document.addEventListener('click', async event => {
    const carocelBig = document.getElementById('carocel_big')
    const clickIsOutside = event.target.classList.contains('control_big_cont')
    if (carocelBig && clickIsOutside) {
      carocelBig?.remove()
      await hideUploadForm(true)
    }
  })

  function handle_bigCau_container (isReady) {
    let element = document.querySelector('.big_spinnerr')
    return isReady && !element.classList.contains('hide_2')
      ? element.classList.add('hide_2')
      : element.classList.remove('hide_2')
  }
  let currentIndex = 0 // Track the current image index
  let images = [] // Array to store the image URLs

  // Helper function to update the image source
  function updateImage () {
    handle_bigCau_container(false)
    const imgElement = document.querySelector('#carocel_big .card-img-top')

    if (images.length > 0) {
      const imageUrl = images[currentIndex]
      imgElement.src = imageUrl
    } else {
      imgElement.src = fallback_img
    }

    // Hide or show prev/next buttons based on currentIndex
    if (currentIndex === 1) {
      prevBTN.style.display = 'none' // Hide prev button
    } else {
      prevBTN.style.display = 'block' // Show prev button
    }

    if (currentIndex === images.length - 1) {
      nextBTN.style.display = 'none' // Hide next button
    } else {
      nextBTN.style.display = 'block' // Show next button
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          handle_bigCau_container(true)
        }
      })
    })

    observer.observe(imgElement)
  }

  // Helper function to add image URLs to the images array
  function addImage (url) {
    images.push(url)
  }

  // Retrieve image URLs from all images in the DOM
  const imageElements = document.querySelectorAll('.card-img-top')
  imageElements.forEach(imgElement => {
    addImage(imgElement.src)
  })

  // Find the index of the current image in the images array
  currentIndex = images.findIndex(imageUrl => imageUrl === imgurl)

  // Add logic to cycle through images when prev or next button is clicked
  const prevBTN = document.querySelector('.prev__btn')
  const nextBTN = document.querySelector('.next__btn')

  prevBTN?.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--
      updateImage()
    }
  })

  nextBTN?.addEventListener('click', () => {
    if (currentIndex < images.length - 1) {
      currentIndex++
    }
    updateImage()
  })
}
function removeElementFromDOM (elementAnchor) {
  if (document.contains(elementAnchor)) {
    elementAnchor.remove()
  }
}
export async function deleteDocument (documentId = '') {
  try {
    const { token } = JSON.parse(sessionStorage.getItem('token'))
    if (!token) {
      return Notify('Session expired! Login required!')
    }
    let colElem = [...document.querySelectorAll('.col')].find(
      card => card.dataset.id === documentId
    )
    let docId = colElem?.dataset.id

    // remove big carocel
    let carocelll = document.querySelector('#carocel_big')
    removeElementFromDOM(carocelll)

    setTimeout(async () => {
      let url = `delete-doc/${docId}`
      const response = await API_CLIENT.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.status === 200) {
        colElem.classList.add('del_effect')
        // remove the card from the DOM
        setTimeout(() => colElem.remove(), 500)
        return Notify('Success: Document deleted!')
      }
    }, 500)
  } catch (error) {
    if (error instanceof TypeError) {
      Notify('Sorry, an error occurred while processing your request.')
      return await LOGIN_HTML()
    }
  } finally {
    runSpinner(true)
  }
}
export async function DisplayUserProfileHTML () {
  let profile_object = await fetchUserProfile()
  if (profile_object === null || profile_object === undefined) {
    runSpinner(false, 'Failed!')
    Notify('There seems to be an issue with your profile account')
    await hideUploadForm(true)
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
          <span class="lead">&#10006;</span>
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
                <div class="text-white border-transparent d-flex mt-3 gap-2">
                  <a href="#" class="btn del_all_docs btn-lg bg-transparent btn-danger text-white">Delete all documents</a>
                  <a href="#" class="btn del_profile btn-lg bg-transparent btn-danger text-white">Delete your profile</a>
                </div>
            </ul>
      </div>
    </div>`

  const container = document.getElementById('innerBody')
  container?.insertAdjacentHTML('afterbegin', innerBodyBig)
  // finished appending remove spinner
  setTimeout(() => runSpinner(true), 100)

  const closeButton = document.querySelector('#carocel_big .lead')
  closeButton?.addEventListener('click', async () => {
    container?.removeChild(document.getElementById('carocel_big'))
    await hideUploadForm(true)
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

  // remove big carucel
  document.addEventListener('click', async event => {
    const carocelBig = document.getElementById('carocel_big')
    const clickIsOutside = event.target.classList.contains('control_big_cont')
    if (carocelBig && clickIsOutside) {
      carocelBig?.remove()
      await hideUploadForm(true)
    }
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
                <li>Once account is created, you'll be logged in automatically. Once you're logged in, you can easily upload your documents. Simply click on the 'Upload' button and select the file you wish to upload. My application supports various file formats, including 'PDF', 'jpeg', 'jpg', 'png', 'gif', 'pdf', 'webp' and 'avif'. Please not, for demo accounts, only one image can be uploaded at a time. </li>
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
  const container = document.getElementById('innerBody')
  container?.insertAdjacentHTML('afterbegin', userGuideServiceModal)
  setTimeout(async () => {
    const modal_btn = document.querySelector('.modaal_cont')
    modal_btn?.click()
  }, 2000)
}
