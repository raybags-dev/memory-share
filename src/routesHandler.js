import fs from 'fs/promises'
import path from 'path'

const __dirname = path.resolve()

export default async app => {
  const routesPath = path.join(__dirname, 'src', 'routes')

  try {
    const files = await fs.readdir(routesPath)

    for (const file of files) {
      if (file.endsWith('Router.js')) {
        const routerModule = await import(path.join(routesPath, file))
        const router = routerModule.default
        app.use(router)
      }
    }
    // not supported
    const { NotSupportedRouter } = await import(
      './controllers/notSupportedController.js'
    )
    app.use(NotSupportedRouter)
  } catch (error) {
    console.error('Error reading router files:', error)
  }
}
