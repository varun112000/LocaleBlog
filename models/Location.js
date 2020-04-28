const mongoose = require('mongoose')
const LocationSchema = mongoose.Schema({
    name : {type : String, required : true},
    image : {type : String, required : true},
    desc : {type : String, required : true},
    comments : [
        {
        type :mongoose.Schema.Types.ObjectId,
        ref  :"Comment"
        }
    ],
    Author:{
        id:{
            type :mongoose.Schema.Types.ObjectId,
            ref  :"User"
        },
        username:String
    }

})
const Location = mongoose.model('Location',LocationSchema)
module.exports = Location