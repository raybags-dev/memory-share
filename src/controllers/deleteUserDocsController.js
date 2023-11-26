import { sendEmail } from '../../middleware/emailer.js'
import { ObjectId } from 'mongodb'
import { DOCUMENT } from '../models/documentModel.js'
import { USER_MODEL, USER_ID_MODEL } from '../models/user.js'
import { deleteFromS3 } from '../../middleware/bd_worker.js'

const { RECIPIENT_EMAIL, KABWEJUMBIRA, AWS_BUCKET_NAME, AWS_REGION } =
  process.env

export async function deleteUserAndOwnDocsRouter (req, res) {
  const userId = req.params.userId
  const user = await USER_MODEL.findById(
    { _id: userId },
    { isAdmin: 0, password: 0, _id: 0 }
  )
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.email === KABWEJUMBIRA) {
    const warning_notice = {
      title: '===== Importnat notice ===== ',
      body: `Important notice from 'memory-share'. Some one has just tried to delete your account associated with < ${KABWEJUMBIRA} >.\n\nAttention required.`
    }
    await sendEmail(warning_notice, RECIPIENT_EMAIL)
    return res
      .status(403)
      .json({ error: 'FORBIDDEN: You cannot delete this account!' })
  }

  if (user) await DOCUMENT.deleteMany({ user: userId })
  await USER_ID_MODEL.deleteOne({ _id: user.userId.toString() })
  // Delete the user
  const { acknowledged } = await USER_MODEL.deleteOne({ _id: userId })

  const { name, email, createdAt } = user
  res.status(200).json({
    status: acknowledged,
    user_profile: { username: name, user_email: email, createdAt },
    message: `User profile ${userId}, and all related documents has been deleted`
  })
}
export async function deleteUserDocsRouter (req, res) {
  const userId = req.params.userId
  const user = await USER_MODEL.findById(
    { _id: userId },
    { isAdmin: 0, password: 0, _id: 0, userId: 0 }
  )
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  if (user.email === KABWEJUMBIRA) {
    const warning_notice2 = {
      title: '===== Importnat notice ===== ',
      body: `Important notice from 'memory-share'.\n\nSome one has just tried to delete your account associated with < ${KABWEJUMBIRA} >.\n\nAttention required.`
    }
    await sendEmail(warning_notice2, RECIPIENT_EMAIL)

    return res.status(403).json({
      error: 'FORBIDDEN: You cannot delete the content of this account!'
    })
  }
  const documents = await DOCUMENT.find({ user: userId })
  if (documents.length === 0) {
    return res.status(200).json({ message: 'User has no documents to delete' })
  }
  for (const document of documents) {
    await deleteFromS3(document.filename)
    await document.delete()
  }
  const deleteUserDocsEmailData = {
    title: 'User documents deleted!',
    body: `All user documents '${documents.length}', have been deleted from your S3 bucket: "${AWS_BUCKET_NAME}" in: ${AWS_REGION}.`
  }
  await sendEmail(deleteUserDocsEmailData, RECIPIENT_EMAIL)

  const { name, email, createdAt } = user
  res.status(200).json({
    message: 'User documents deleted',
    user_profile: { username: name, user_email: email, createdAt }
  })
}
export async function DeleteOneDocRouter (req, res) {
  const itemId = req.params.id
  const userId = req.user.data._id
  let item = await DOCUMENT.findOne({ _id: new ObjectId(itemId) })
  if (!item) return res.status(404).json('Document could not be found')

  if (item && req.user.isAdmin) {
    await deleteFromS3(item.filename)
    await item.delete()

    return res.status(200).json({
      message: 'Document deleted',
      deletedDocument: {
        filename: item.filename,
        _id: item._id,
        deletedAt: new Date().toISOString()
      }
    })
  }
  // If the user created the document, they can delete it
  if (item.user.toString() === userId.toString()) {
    await deleteFromS3(item.filename)
    await item.delete()
    return res.status(200).json({
      message: 'Document deleted',
      deletedDocument: {
        filename: item.filename,
        _id: item._id,
        deletedAt: new Date().toISOString()
      }
    })
  }
  return res
    .status(401)
    .json({ message: 'You are not authorized to delete this Document' })
}
