import { liteClient as algoliaLiteClient } from "algoliasearch/lite";
import Constants from "expo-constants";

const extra = (Constants?.expoConfig ?? Constants?.manifest ?? {}).extra ?? {};
const algoliaExtra = extra?.algolia ?? {};

const config = {
    appId: algoliaExtra.appId || algoliaExtra.algoliaAppId || "",
    searchApiKey: algoliaExtra.searchApiKey || algoliaExtra.algoliaSearchKey || "",
    indexPrefix: algoliaExtra.indexPrefix || algoliaExtra.algoliaIndexPrefix || "",
};

let cachedClient = null;
const createClient = typeof algoliaLiteClient === "function" ? algoliaLiteClient : null;

export const SEARCHABLE_FIELDS = ["title", "tags", "content"];

export function getAlgoliaClient() {
    if (!config.appId || !config.searchApiKey || !createClient) {
        return null;
    }
    if (!cachedClient) {
        cachedClient = createClient(config.appId, config.searchApiKey);
    }
    return cachedClient;
}

export function getAlgoliaIndexName(collectionName) {
    if (!collectionName) return collectionName;
    const prefix = config.indexPrefix?.trim();
    return prefix ? `${prefix}_${collectionName}` : collectionName;
}

export function getAlgoliaConfig() {
    return { ...config };
}

export function isAlgoliaConfigured() {
    return Boolean(config.appId && config.searchApiKey);
}
