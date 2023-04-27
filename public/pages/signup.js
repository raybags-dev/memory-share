import { LOGIN_HTML, loginUser } from '../pages/login.js'
import { API_CLIENT, runSpinner, Notify } from '../lifters/works.js'

export async function SIGNUP_HTML () {
  let pageContent = `
      <nav class="navbar navbar-expand-lg">
      <div class="container-fluid">
          <a class="navbar-brand p-2 mb-1" href="#">
              <img src="https://github.com/raybags-web-dev/image_base/blob/master/images/logo/logo9_5_21251.jpeg?raw=true" alt="" width=40" height="40" style="border-radius: 50%;"
                  class="d-inline-block align-text-top">
          </a>
          <ul class="navbar-nav ">
              <li class="nav-item">
                  <a id="to_login_p" class="nav-link active text-white" aria-current="page" href="#">Login</a>
              </li>
          </ul>
      </div>
  </nav>
  <main id="main__wrapper" class="container container-fluid my-10 position-relative">
      <div class="container sign___up container-fluid">
          <h3 class="text-center p-3 text-white">Signup</h3>
          <form class="shadow-lg p-3 rounded pt-2 text-white" id="signup_form">
              <div class="mb-3">
                  <label for="exampleInputName" class="form-label">Name</label>
                  <input type="text" name="name" class="form-control" id="exampleInputName"
                      placeholder="Enter your name" required>
                  <div class="invalid-feedback">Please enter your name.</div>
              </div>
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
                  <button id="signup_bt" style="box-shadow: inset 0 -3em 3em rgba(0, 0, 0, 0.1), 0 0 0 2px rgb(255, 255, 255, .4),
                  0.3em 0.3em 1em rgba(0, 0, 0, 0.3);" type="submit" class="btn btn-transparent text-white" type="button">Submit</button>
              </div>
          </form>
      </div>
  </main>
    `
  document.getElementById('innerBody').innerHTML = pageContent

  const navbarBrand = document.querySelector('#to_login_p')
  navbarBrand?.addEventListener('click', async () => {
    LOGIN_HTML()
  })
  // =========================================================
  const signupForm = document.querySelector('#signup_form')

  signupForm?.addEventListener('submit', async event => {
    event.preventDefault()
    const formData = new FormData(signupForm)
    const user = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password')
    }
    try {
      runSpinner(false)
      let url = '/uploader/create-user'
      const response = await API_CLIENT.post(url, user, {
        headers: { 'Content-Type': 'application/json' }
      })
      const { data, status } = await response
      const { email, name } = data.user

      if (status === 201) {
        runSpinner(true)
        const storedUser = { name, email, isUser: true }
        localStorage.setItem('user', JSON.stringify(storedUser))

        Notify(`Account for '${storedUser.name}', has been created.`)
        setTimeout(() => {
          history.pushState(null, null, '/')
          runSpinner(true)
          //   ======
          loginUser(user)
          //   =======
        }, 5000)
        return
      }
      Notify('Something went wrong, try again later.')
      setTimeout(() => runSpinner(true), 3000)
    } catch (error) {
      console.log(error)
    }
  })
}
