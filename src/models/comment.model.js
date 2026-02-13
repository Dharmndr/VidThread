import mongoose,{Schema} from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const commentSchema = new Schema(
{  
 content:{  
    type: String,
    required: true 
 },  
 video:{
    type: Schema.Types.ObjectId,
    ref:"Video"
 },
 owner:{
    type: Schema.Types.ObjectId, 
    ref:"User"  
 },
 tweet:{
     type: Schema.Types.ObjectId,
     ref:"Tweet"
 }
},
{timestamps:true})

commentSchema.plugin(mongoosePaginate); // manages page limit to show 
export const Comment = mongoose.model("Comment",commentSchema);