import { DOCUMENT } from '../models/documentModel.js'
import { checkAndUpdateDocumentUrls } from '../../middleware/bd_worker.js'

export async function paginatedDocsRouter (req, res) {
  const userId = req.user.data._id
  const query = DOCUMENT.find({ user: userId }, { token: 0 }).sort({
    createdAt: -1
  })
  const countQuery = query.model.find(query.getFilter())
  const count = await countQuery.countDocuments()
  let page = parseInt(req.query.page) || 1
  let perPage = parseInt(req.query.perPage) || 10
  let totalPages = Math.ceil(count / perPage)
  const skip = (page - 1) * perPage
  const response = await query.skip(skip).limit(perPage)
  if (response.length === 0)
    return res.status(404).json({
      message: 'nothing found',
      totalCount: count,
      data: response
    })

  const updatedDocs = await checkAndUpdateDocumentUrls(response)
  res.status(200).json({
    totalPages: totalPages,
    totalCount: count,
    data: updatedDocs
  })
}
