# DOCUMENT UPLOADER

Memory share an app that stores images and PDFs

## Endpoints

### POST:
```javascript
/raybags/v1/user/login

{
    "email":"email address",
    "password":<password>
}
```

### POST:
```javascript
/raybags/v1/uploader/upload
form-data
images: files
```

 Get one document :
```javascript
/raybags/v1/wizard/uploader/:id
```

For all documents.

```javascript
/raybags/v1/uploader/paginated-user-documents?page=<page number>&perPage=10
```
