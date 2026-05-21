import axions from 'axions';

const api = axions.create({
    baseURL: import.meta.env.VITE_BASEURL
})

export default api