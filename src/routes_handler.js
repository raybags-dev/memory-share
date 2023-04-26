import {
  CreateUser,
  Login,
  DocsUploader,
  AllUserDocs,
  NotSupported,
  FindOneItem,
  GetPaginatedDocs,
  deleteUserAndOwnDocs,
  DeleteOneDoc,
  GetAllUsers
} from './routes/router.js'

export default async app => {
  CreateUser(app)
  Login(app)
  DocsUploader(app)
  AllUserDocs(app)
  FindOneItem(app)
  GetPaginatedDocs(app)
  deleteUserAndOwnDocs(app)
  DeleteOneDoc(app)
  GetAllUsers(app)
  app.use(NotSupported)
}
