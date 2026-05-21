import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import { provider } from 'react-redux'
import { store } from './app/store.js'

//import your publication key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY){
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <BrowserRouter>
    <provider store={store}>
      <App />
    </provider>
    </BrowserRouter>
  </ClerkProvider>
)
