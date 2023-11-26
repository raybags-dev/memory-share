import { DOCUMENT } from '../models/documentModel.js'
import { checkAndUpdateDocumentUrls } from '../../middleware/bd_worker.js'

export async function SearchUserDocsRouter (req, res) {
  const { searchQuery } = req.body
  const isAdmin = req.user.isAdmin
  let query, count

  if (!searchQuery) {
    return res.status(400).json('Search query is required.')
  }

  if (isAdmin) {
    query = DOCUMENT.find(
      { $text: { $search: searchQuery } },
      { token: 0 }
    ).sort({ createdAt: -1 })
    count = await DOCUMENT.countDocuments({
      $text: { $search: searchQuery }
    })
  } else {
    query = DOCUMENT.find(
      { user: req.user.data._id, $text: { $search: searchQuery } },
      { token: 0 }
    ).sort({ createdAt: -1 })
    count = await DOCUMENT.countDocuments({
      user: req.user.data._id,
      $text: { $search: searchQuery }
    })
  }

  const response = await query

  if (response.length === 0) return res.status(404).json('Nothing found!')

  const updatedDoc = await checkAndUpdateDocumentUrls(response)
  res.status(200).json({ count, documents: updatedDoc })
}
