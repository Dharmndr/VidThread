import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweetSchema = new Schema({
   content:{
    type:String,
    required:true 
   },
   views:{
   type:Number,
   default:0
   },
   owner:{
       type:Schema.Types.ObjectId, 
       ref:"User"
   }
},{timestamps:true})

tweetSchema.plugin(mongooseAggregatePaginate)
export const Tweet = mongoose.model("Tweet",tweetSchema);