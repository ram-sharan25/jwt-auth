import { Resolver, Query, Mutation, Arg, ObjectType, Field, Ctx, UseMiddleware,Int} from "type-graphql";
import { User } from "./entity/User";
import { compare, hash } from "bcryptjs";
import { MyContext } from "./MyContext";
import { createAccessToken, createRefreshToken } from "./auth";
import { isAuth } from "./isAuth";
import { sendRefreshToken } from "./refreshToken";

import { AppDataSource } from "./data-source";



@ObjectType()
class LoginResponse{
  @Field()
  accessToken:string;
}
@Resolver()
export class UserResolver {

  @Query(() => String)
  hello() {
    return `hi, !`;
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye( @Ctx(){payload}:MyContext) {
    return `your user id is ${payload?.userId}`
  }
  
  @Query(() => [User])
  user() {
    return User.find();
  }

  @Mutation(() => Boolean)
  async register(
    @Arg("email") email: string,
    @Arg("password") password: string
  ) {
    const hashedPassword = await hash(password, 12);
    try {
      await User.insert({
        email,
        password: hashedPassword,
      });
    } catch (err) {
      console.log(err);
      return false;
    }
    return true;
  }

  @Mutation(()=>Boolean)
  async revokeRefreshTokensForUser(@Arg("userId",()=>Int) userId:number){
    await  AppDataSource.getRepository(User).increment({id:userId},"tokenVersion",1)
    return 1 
  }

@Mutation(() => LoginResponse)
  async login(
    @Arg("email") email: string,
    @Arg("password") password: string,
    //@ts-ignore
    @Ctx(){req,res}:MyContext
  ):Promise<LoginResponse> {

    const user  = await User.findOne({where:{email}})
    if(!user){
      throw new Error("User not found")
    }
    const valid  =await compare(password,user.password)
    if(!valid){
      throw new Error("bad Password")
    }
    console.log("Req",res)
    sendRefreshToken(res,createRefreshToken(user))
    //login successful
    return {
      accessToken:createAccessToken(user)
    };
  }
}
