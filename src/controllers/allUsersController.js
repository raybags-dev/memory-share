import { DOCUMENT } from '../models/documentModel.js'
import { checkAndUpdateDocumentUrls } from '../../middleware/bd_worker.js'

export async function AllUserDocsRouter (req, res) {
  const isAdmin = req.user.isAdmin
  let query, count
  if (isAdmin) {
    query = DOCUMENT.find({}, { token: 0 }).sort({ createdAt: -1 })
    count = await DOCUMENT.countDocuments({})
  } else {
    query = DOCUMENT.find({ user: req.user.data._id }, { token: 0 }).sort({
      createdAt: -1
    })
    count = await DOCUMENT.countDocuments({ user: req.user.data._id })
  }
  const response = await query
  console.log(response)
  if (response.length === 0) return res.status(404).json('Nothing found!')

  const updatedDoc = await checkAndUpdateDocumentUrls(response)
  res.status(200).json({ count: count, documents: updatedDoc })
}
