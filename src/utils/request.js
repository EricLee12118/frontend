import axios from 'axios';

const request = axios.create({
    baseURL:"localhost:5000",
    timeout:5000
})

//添加拦截
request.interceptors.request.use(config => {
    console.log('发送了request')
    return config
},error => {
    return Promise.reject(error)
})

request.interceptors.response.use(res => {
    return res.data
},error => {
    return Promise.reject(error)
})




export default request;