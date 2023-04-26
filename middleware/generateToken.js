import { randomBytes } from 'crypto'
const token = randomBytes(64).toString('hex')

export const GenToken = async () => {
  const secretToken = token
  return secretToken
}
