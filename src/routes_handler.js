import {
  CreateUser,
  Login,
  DocsUploader,
  AllUserDocs,
  NotSupported,
  FindOneItem,
  FindOneItemForDowload,
  GetPaginatedDocs,
  deleteUserAndOwnDocs,
  deleteUserDocs,
  DeleteOneDoc,
  GetAllUsers,
  GetUser
} from './routes/router.js'

export default async app => {
  CreateUser(app)
  Login(app)
  DocsUploader(app)
  AllUserDocs(app)
  FindOneItem(app)
  FindOneItemForDowload(app)
  GetPaginatedDocs(app)
  deleteUserAndOwnDocs(app)
  deleteUserDocs(app)
  DeleteOneDoc(app)
  GetAllUsers(app)
  GetUser(app)
  app.use(NotSupported)
}
