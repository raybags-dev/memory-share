import { SIGNUP_HTML } from '../pages/signup.js'
import { API_CLIENT, runSpinner, Notify } from '../lifters/works.js'
import { MAIN_PAGE } from '../pages/main_container.js'

export async function LOGIN_HTML () {
  let pageContent = `
    <nav class="navbar navbar-expand-lg">
    <div class="container-fluid">
        <a class="navbar-brand p-2 mb-1" href="#">
            <img src="https://github.com/raybags-web-dev/image_base/blob/master/images/logo/logo9_5_21251.jpeg?raw=true" alt="" width=40" height="40" style="border-radius: 50%;"
                class="d-inline-block align-text-top">
        </a>
  
        <ul class="navbar-nav">
            <li class="nav-item">
                <a id="to_sigup_p" class="nav-link active text-white" aria-current="page" href="#">Signup</a>
            </li>
        </ul>
    </div>
  </nav>
  <main id="main__wrapper" class="container container-fluid my-10 position-relative">
    <div class="container log___in container-fluid">
        <h3 class="text-center p-3 text-white">Login</h3>
        <form id="login___form" class="shadow-lg p-3 rounded pt-2 text-white">
                <div class="mb-3">
                <label for="exampleInputEmail1" class="form-label">Email address</label>
                <input type="email" name="email" class="form-control" placeholder="Enter your email"
                    id="exampleInputEmail1" aria-describedby="emailHelp" required>
                <div class="invalid-feedback">Please enter a valid email address.</div>
            </div>
            <div class="mb-3">
                  <label for="exampleInputPassword1" class="form-label">Password</label>
                  <input type="password" name="password" placeholder="Enter your password" class="form-control"
                      id="exampleInputPassword1" required>
                  <div class="invalid-feedback">Please enter your password.</div>
              </div>
            <div class="d-grid gap-2">
                <button type="submit" style="box-shadow: inset 0 -3em 3em rgba(0, 0, 0, 0.1), 0 0 0 2px rgb(255, 255, 255, .4),
                0.3em 0.3em 1em rgba(0, 0, 0, 0.3);" class="btn btn-transparent login_btn text-white">Submit</button>
            </div>
        </form>
    </div>
  
  </main>
      `
  document.getElementById('innerBody').innerHTML = pageContent

  const navbarBrand = document.querySelector('#to_sigup_p')
  navbarBrand?.addEventListener('click', async () => {
    SIGNUP_HTML()
  })

  const loginForm = document.querySelector('#login___form')

  //   ********* Handle form validation ***********
  loginForm.addEventListener('submit', async event => {
    event.preventDefault()
  })
  loginForm?.addEventListener('submit', async event => {
    runSpinner(false, 'Processing')
    event.preventDefault()
    const formData = new FormData(loginForm)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      let url = '/user/login'
      const response = await API_CLIENT.post(url, { email, password })
      if (response.status == 200) {
        runSpinner(true)
        const token = response.headers.authorization.split(' ')[1]
        sessionStorage.setItem('token', JSON.stringify({ token, email }))
        // Redirect to main page
        sessionStorage.setItem('redirected', true)
        Notify(`Login successfull`)
        setTimeout(() => {
          runSpinner(true)
          history.pushState(null, null, '/')
          //   ***********************
          MAIN_PAGE()
          //   ***********************
        }, 3000)
      }
    } catch (error) {
      runSpinner(false, 'Failed!')
      const errorMessage = error.response.data.error || 'An error occurred.'
      Notify(`Credentials: ${errorMessage}.`)
      setTimeout(() => runSpinner(true), 3000)
    }
  })
}

export async function loginUser (user) {
  runSpinner(false, 'Processing')
  const email = user.email
  const password = user.password

  try {
    let url = '/user/login'
    const response = await API_CLIENT.post(url, { email, password })
    if (response.status == 200) {
      runSpinner(true)
      const token = response.headers.authorization.split(' ')[1]
      sessionStorage.setItem('token', JSON.stringify({ token, email }))
      // Redirect to main page
      sessionStorage.setItem('redirected', true)
      Notify(`Login successfull`)
      setTimeout(() => {
        runSpinner(true)
        //   ***********************
        MAIN_PAGE()
        //   ***********************
      }, 2000)
    }
  } catch (error) {
    runSpinner(false, 'Failed!')
    const errorMessage = error.response.data.error || 'An error occurred.'
    Notify(`Session: ${errorMessage}.`)
    setTimeout(() => runSpinner(true), 2000)
    console.log(error)
  } finally {
    runSpinner(true)
  }
}
