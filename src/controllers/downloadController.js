import { ObjectId } from 'mongodb'
import { DOCUMENT } from '../models/documentModel.js'

import {
  checkAndUpdateDocumentUrls,
  createFileReadStream
} from '../../middleware/bd_worker.js'

export async function downloadRouter (req, res) {
  try {
    const itemId = req.params.id
    const userId = req.user.data._id
    const document = await DOCUMENT.findOne({ _id: new ObjectId(itemId) })
    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }
    if (document.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }
    const updatedDoc = await checkAndUpdateDocumentUrls([document])
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${updatedDoc[0].filename}"`
    )
    const fileStream = await createFileReadStream(updatedDoc[0].data)
    fileStream.pipe(res)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Server error' })
  }
}
