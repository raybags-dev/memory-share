# Document Uploader  Application

Welcome to the official documentation for **Document Uploader Application**. This document provides detailed information about the available API endpoints and how to use them effectively.

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
  - [Create User](#create-user)
  - [Login](#login)
  - [Upload Documents](#upload-documents)
  - [Retrieve All User Documents](#retrieve-all-user-documents)
  - [Retrieve One Document](#retrieve-one-document)
  - [Retrieve Paginated User Documents](#retrieve-paginated-user-documents)
  - [Delete User and Owned Documents](#delete-user-and-owned-documents)
  - [Delete User Documents](#delete-user-documents)
  - [Get All Users](#get-all-users)
  - [Get User by Email](#get-user-by-email)
- [Contributing](#contributing)

## Introduction

**Document Uploader  Application** is a powerful platform that offers a range of features to users. This documentation is designed to help developers understand how to interact with the application's API.

## Getting Started

To get started with the API, follow these steps:

1. Clone the repository to your local machine.
2. Install the necessary dependencies.
3. Configure your environment variables as needed.
4. Run the application.

For detailed instructions for installation and configuration contact me directly at `baguma.github@gmail.com `

## API Endpoints

Here's a comprehensive list of the available API endpoints and their descriptions.

### Create User

- **Endpoint**: `POST /raybags/v1/uploader/create-user`
- **Description**: Create a new user in the system.
- **Usage**:
  - Send a POST request to this endpoint with the required user data.
  - If successful, receive a 201 response with user information and a JWT token.

### Login

- **Endpoint**: `POST /raybags/v1/user/login`
- **Description**: Authenticate a user and generate a JWT token.
- **Usage**:
  - Send a POST request with user credentials.
  - Receive a 200 response with user information and a JWT token upon successful authentication.

### Upload Documents

- **Endpoint**: `POST /raybags/v1/uploader/upload`
- **Description**: Upload documents to the system.
- **Authorization**: Requires a valid JWT token.
- **Usage**:
  - Send a POST request with files to be uploaded (multipart/form-data).
  - Endpoint performs checks and responds with appropriate status codes.

### Retrieve All User Documents

- **Endpoint**: `POST /raybags/v1/uploader/user-docs`
- **Description**: Retrieve all documents owned by the user.
- **Authorization**: Requires a valid JWT token.
- **Usage**:
  - Send a POST request to retrieve user documents.
  - Receive a 200 response with document information.

## Contributing

I welcome contributions from the community! If you'd like to contribute to **Document Uploader  Application**, please feel free and send in a MR.


---

**Document Uploader  Application** - Making your life awesome, uploading images, creating memories and so on.
