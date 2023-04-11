import React from 'react'

function Card(props) {
    return (
        <div className=' w-52  h-56 m-10 rounded-md border-indigo-800 border p-1'>
            <p>{props.name}</p>
            <img className=' object-fill h-full' src={props.url}></img>
        </div>
    )
}

export default Card