import "reflect-metadata";
import express, {Request, Response } from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./UserResolver";
import { AppDataSource } from "./data-source";
import cookieParser from "cookie-parser";
import { verify } from "jsonwebtoken"
import { createAccessToken, createRefreshToken } from "./auth";
import { User } from "./entity/User";
import { sendRefreshToken } from "./refreshToken";


(async () => {
  const app = express();
  app.use(cookieParser())
  

  app.get("/", (_, res) => {
    res.send("Hello");
  });

  app.post("/refresh_token",async (req,res) => {
    
    const token = req.cookies.jid;
    if(!token){
      return res.send({ok:false,accessToken:""})
    }
    console.log({token})
    let payload:any = null
    try{
      payload = verify(token,process.env.REFRESH_TOKEN_SECRET!) as any 
      console.log(payload)

    }catch (err){
      console.log("Error occurred")
      return res.send({ok:false,accessToken:""})
    }
    const userId = payload.userId
    const user = await User.findOne({where:{id:userId}})
    
    if(!user){
      return res.send({ok:false,accessToken:""})
    }
    if(user.tokenVersion!==payload.tokenVersion){
      return res.send({ok:false,accessToken:""})
    }
   sendRefreshToken(res,createRefreshToken(user))
    console.log({ok:true,accessToken: createAccessToken(user)})
    // return res.send("ok")
    return res.send({ok:true,accessToken: createAccessToken(user)})
      
   
  });

  await AppDataSource.initialize();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
    }),
    //@ts-ignore
    context:({req,res}:{req:Request,res:Response})=>({req,res})
  });
  await apolloServer.start();
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("Server Started");
  });
})();
// AppDataSource.initialize()
//   .then(async () => {
//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await AppDataSource.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await AppDataSource.manager.find(User);
//     console.log("Loaded users: ", users);

//     console.log(
//       "Here you can setup and run express / fastify / any other framework."
//     );
//   })
//   .catch((error) => console.log(error));
