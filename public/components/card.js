import { formatDate, formatEmail, runSpinner } from '../lifters/works.js'
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
  let fall_back = 'images/fallback.jpeg'
  let cardContent = `
    <div class="col bg-transparent" data-id="${_id}">
      <div class="card  bg-transparent h-100 rounded" style="object-fit:cover !important;">
        <div class="skeleton"><span class="image_loader"></span></div>
        <div class="img-container" style="width:100% !importnat;min-height:50vh;object-fit:cover !important; object-position: top;">
            <img src="${
              `${url}/${signature}` || fall_back
            }" class="card-img-top border-dark h-100 img-fluid hide_2 img_card ${_id}"  alt="..." onload="this.classList.remove('hide_2')" min-height-50%>
      </div>
        <div class="card-body text-white">
          <ul class="list-group rounded">
            <li class="list-group-item bg-transparent text-white">${formatEmail(
              email
            )}</li>
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
        setTimeout(() => skeleton.classList.add('hide'), 1500)
      } else {
        image.addEventListener('load', () => {
          let skeleton = card.querySelector('.skeleton')
          setTimeout(() => skeleton.classList.add('hide_2'), 1500)
        })
      }
    })
  }
}
// ******** Implimenting Caiucel **********
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
  let fallbaskIMG = '../images/profile_pic.webp'
  const innerBodyBig = `
    <div id="carocel_big" class="container rounded" data-carucel="${
      _id && _id
    }" style="z-index:100">
      <span class="lead">X</span>
      <div class="container __bigOne__">
      <div class="main-del-cont" style="cursor:pointer !important;">
      <i class="fa-regular fa-trash-can"></i>
      </div>
        <div class="card bg-transparent" data-user="${
          userId && userId
        }"  style="width:50%;height:70% !important">
          <img src="${
            (imgurl && imgurl) || fallbaskIMG
          }" class="card-img-top img-fluid" alt="...">
          <div id="description" class="card-body" style="z-index: 100;">
            <h5 class="card-title">${email && email}</h5>
            <hr>
            <p class="">User: ${userId && userId}</p>
            <p class="">Original file: ${originalname && originalname}</p>
            <p class="">New file: ${filename && filename}</p>
            <p class=""> File size: ${size && size}</p>
            <p class="">Encoding type: ${encoding && encoding}</p>
            <p class="">Content type: ${contenttype && contenttype}</p>
            <p class="card-text"><small class="text-muted">Created: ${
              createdAt && createdAt
            }</small></p>
            <p class="card-text"><small class="text-muted">Updated: ${
              updaedAt && updaedAt
            }</small></p>
          </div>
        </div>
      </div>
    </div>`

  const container = document.getElementById('innerBody')
  container?.insertAdjacentHTML('afterbegin', innerBodyBig)
  // finished appending remove spinner
  setTimeout(() => runSpinner(true), 100)

  const closeButton = document.querySelector('#carocel_big .lead')
  const closeOnIconClick = document.querySelector('.off__Container')
  closeButton?.addEventListener('click', function () {
    container?.removeChild(document.getElementById('carocel_big'))
  })
  closeOnIconClick?.addEventListener('click', async function () {
    try {
      if (!container) return
      container?.removeChild(document.getElementById('carocel_big'))
    } catch (error) {
      console.log('An error occured: ' + error.message)
    }
  })
  // ******* Updated logic
  let IMGCONT = document.querySelector('#carocel_big')
  IMGCONT.addEventListener('click', function (event) {
    if (!IMGCONT.contains(event.target)) {
      removeElementFromDOM(IMGCONT)
    }
  })
}
function removeElementFromDOM (elementAnchor) {
  if (document.contains(elementAnchor)) {
    elementAnchor.remove()
  }
}
