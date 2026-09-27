import axios from "axios"

const BASE_URL =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000`

export const predictFreshness = async (sensorData) => {
    const response = await axios.post(`${BASE_URL}/predict`, sensorData)
    return response.data
}

export const getHistory = async () => {
    const response = await axios.get(`${BASE_URL}/history`)
    return response.data
}

export const getAnalytics = async () => {
    const response = await axios.get(`${BASE_URL}/analytics`)
    return response.data
}

export const getLiveData = async () => {
    const response = await axios.get(`${BASE_URL}/live`)
    return response.data
}

export const getLiveHistory = async (limit = 20) => {
    const response = await axios.get(`${BASE_URL}/live/history?limit=${limit}`)
    return response.data
}

export const getDeviceStatus = async () => {
    const response = await axios.get(`${BASE_URL}/device/status`)
    return response.data
}