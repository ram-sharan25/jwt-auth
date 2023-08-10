import {  MiddlewareFn } from "type-graphql/dist/interfaces/Middleware"
import { MyContext } from "./MyContext"
import { verify } from "jsonwebtoken"

export const isAuth:MiddlewareFn<MyContext> = ({context},next)=>{
    const authorization = context.req.headers['authorization']
    if(!authorization){
        throw new Error("Not authorized")
    }
    try{
       const token  =  authorization?.split(" ")[1]
       console.log("Token",token)
       const payload = verify(token,process.env.ACCESS_TOKEN_SECRET!)
       console.log("Payload",payload)
       context.payload = payload as any;
    }catch(err){
        console.log("Error occurred in Authorization",err)
        throw new Error("Not authorized")
        // 
    }
return next()
  }