
import './App.css'
import {createBrowserRouter,RouterProvider} from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import PostJobs from './pages/PostJobs'
import Layout from './pages/Layout'
import ViewJobs from './pages/ViewJobs'
import { Toaster } from 'react-hot-toast'
function App() {

const router = createBrowserRouter([
  {
    path:'/',
    element:<Layout/>,
    children:[
      {
    path:'/',
    element:<Home to='/home' replace/>
  },
  {
    path:'/dashboard',
    element:<Dashboard/>
  },
  {
    path:'/postJobs',
    element:<PostJobs/>
  },
  {
    path:'/job/:id',
    element:<ViewJobs/>
  }
    ]
  }
  
])
  return (
    <>
      <RouterProvider router={router}/>
      <Toaster position='top-right'/>
    </>
  )
}

export default App
