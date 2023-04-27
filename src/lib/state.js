import { proxy } from 'valtio'

const state = proxy({
    isAdmin: false
})

export default state;