import 'dotenv/config'
const ENV=process.env
export default {
	apiKey: ENV.POSTMAN_API_KEY,
	collectionUrl: ENV.POSTMAN_COLLECTION_URL,
	collectionFilepath: ENV.POSTMAN_COLLECTION_FILEPATH,
	globalHeaders: ENV.POSTMAN_GLOBAL_HEADERS,
	variables: ENV.POSTMAN_VARIABLES
}
