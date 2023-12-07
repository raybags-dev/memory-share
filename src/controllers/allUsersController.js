import { DOCUMENT } from '../models/documentModel.js'
import { USER_MODEL } from '../models/user.js'
import { checkAndUpdateDocumentUrls } from '../../middleware/bd_worker.js'

export async function AllUserDocsRouter (req, res) {
  try {
    const { isAdmin, _id: userId } = req.user

    await DOCUMENT.validateDocumentOwnership(req, res, async () => {
      let query, count

      if (isAdmin) {
        query = DOCUMENT.find({}, { token: 0 }).sort({ createdAt: -1 })
        count = await DOCUMENT.countDocuments({})
      } else {
        // filter documents only owned by the user
        query = DOCUMENT.find({ $or: [{ user: userId }] }, { token: 0 }).sort({
          createdAt: -1
        })

        count = await DOCUMENT.countDocuments({ user: userId })
      }
      const response = await query

      if (response.length === 0) return res.status(404).json('Nothing found!')

      // Filter documents based on ownership using the isOwner method
      const ownedDocuments = response.filter(async doc => {
        return await USER_MODEL.isOwner(userId, doc.user.toString())
      })

      // Use the checkAndUpdateDocumentUrls function to update document URLs
      const updatedDoc = await checkAndUpdateDocumentUrls(ownedDocuments)
      res.status(200).json({ count: count, documents: updatedDoc })
    })
  } catch (error) {
    console.error('Error in AllUserDocsRouter:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
