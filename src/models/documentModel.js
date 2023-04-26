import mongoose from 'mongoose'

const DocumentModel = {
  originalname: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  token: {
    type: String,
    maxlength: 500,
    minlength: 3
  },
  data: {
    type: Buffer,
    required: true
  },
  url: {
    type: String,
    required: true,
    default: ''
  },
  signature: {
    type: String,
    require: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  size: {
    type: String,
    trim: true,
    maxlength: 500,
    minlength: 1
  },
  encoding: {
    type: String,
    trim: true,
    maxlength: 100,
    minlength: 1,
    required: true
  }
}

const DOCUMENT_SCHEMA = new mongoose.Schema(DocumentModel, {
  timestamps: true
})

const DOCUMENT = mongoose.model('document-collection', DOCUMENT_SCHEMA)
export { DOCUMENT }

// import mongoose from 'mongoose'

// const DocumentModel = {
//   originalname: {
//     type: String,
//     required: true
//   },
//   filename: {
//     type: String,
//     required: true
//   },
//   contentType: {
//     type: String,
//     required: true
//   },
//   data: {
//     type: Buffer,
//     required: true
//   },
//   token: {
//     type: String,
//     maxlength: 500,
//     minlength: 3
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   size: {
//     type: String,
//     trim: true,
//     maxlength: 500,
//     minlength: 1
//   },
//   encoding: {
//     type: String,
//     trim: true,
//     maxlength: 100,
//     minlength: 1,
//     required: true
//   }
// }

// const DOCUMENT_SCHEMA = new mongoose.Schema(DocumentModel, {
//   timestamps: true
// })

// const DOCUMENT = mongoose.model('document-collection', DOCUMENT_SCHEMA)

// export { DOCUMENT }
