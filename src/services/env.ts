import 'dotenv/config'
const ENV = process.env

export class EnvService {
    apiKey = ENV.POSTMAN_API_KEY
    collectionUrl = ENV.POSTMAN_COLLECTION_URL
    collectionFilepath = ENV.POSTMAN_COLLECTION_FILEPATH
    globalHeaders = ENV.POSTMAN_GLOBAL_HEADERS
    variables = ENV.POSTMAN_VARIABLES
}

export default new EnvService()
