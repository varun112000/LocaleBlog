const express = require('express')
const app = express()
const mongoose = require('mongoose')
const User = require('./models/User')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const bodyparser = require('body-parser')
const Location = require('./models/Location')
const Comment = require('./models/Comment')
const flash = require("express-flash")
const cookieParser = require("cookie-parser")
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
var session = require('express-session')
var sessionStore = new session.MemoryStore;

app.use(bodyparser.urlencoded({extended:true}))
app.set('view engine','ejs')
app.use(express.static(__dirname + "/public"));
app.use(cookieParser('secret'));

app.use(require("express-session")({
    secret:"Hello",
    resave : false,
    saveUninitialized : false,
    store: sessionStore,

}))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(function(req,res,next){
    res.locals.currentUser = req.user
    res.locals.error = req.flash('error')
    res.locals.success = req.flash('success')
    next()
})

mongoose.connect("mongodb+srv://varun:varun@locale-zcimb.mongodb.net/test?retryWrites=true&w=majority",{useNewUrlParser:true,useUnifiedTopology:true,useFindAndModify:false})
mongoose.connection
    .once("open",function(){console.log("Connected To DataBase")})
    .on("error",function(){console.log("Error To Connect DataBase")})

app.get('/register',function(req,res){
    res.render('register', {page: 'register'})
})
app.post('/register',function(req,res){
    User.register(new User({username:req.body.username}),req.body.password,function(err,user){
        if(err){
            return res.render("register", {error: err.message});
        }
        passport.authenticate('local')(req, res, function(){
            req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
            res.redirect('/login')
        })      
    })
})
app.get('/login',function(req,res){
    res.render('login',{page:'login'})
})
app.post('/login', passport.authenticate('local',{
    successRedirect:"/locations",
    failureRedirect:"/login",
    failureFlash:true,
    successFlash: 'Welcome to Locale'
}),function(req,res){
})
app.get("/logout",isLoggedIn,function(req,res){
    req.logOut()
    req.flash("success", "See you later!")
    res.redirect('/')
})
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}
///////////////////////////////////////
app.get('/',function(req, res){
    res.render("root")
})
app.get('/locations',isLoggedIn,function(req, res){
    Location.find({},function(err,locations){
        if(err){
            console.log("err")
            req.flash("error",err.message)
        }else{
            res.render('locations',{locations:locations})
        }
    })
})
app.get('/locations/new',isLoggedIn,function(req,res){
    res.render('new')
})
app.get('/locations/:id',isLoggedIn,function(req,res){
    Location.findById(req.params.id).populate("comments").exec(function(err,location){
        if(err){
            console.log(err)
            req.flash('error', 'Sorry, that campground does not exist!');
            res.redirect('/locations')
        }else{
            res.render("show",{location:location})
        }
    })
})
app.get('/locations/:id/edit',isLoggedIn,function(req,res){
    Location.findOne({_id:req.params.id},function(err,location){
        if(err){
            console.log(err)
            req.flash('error',err.message)
        }else{
            if(location.Author.id.equals(req.user.id)){
                res.render('edit',{location:location})
            }
            else{
                res.redirect('back')
            }
        }
    })
})
app.get('/locations/:id/comment',isLoggedIn,function(req,res){
    Location.findOne({_id:req.params.id},function(err,location){
        if(err){
            console.log(err)
        }else{
            res.render('commentnew',{location:location})
        }
    })
})
app.get('/locations/:id/comment/:id2/edit',isLoggedIn,function(req,res){
    Location.findOne({_id:req.params.id},function(err,location){
        if(err){
            console.log(err)
            req.flash('error',err.message)
        }else{
            Comment.findOne({_id:req.params.id2},function(err,comment){
                if(err){
                    console.log(err)
                }else{
                    if(comment.Author.id.equals(req.user.id)){
                        res.render('commentedit',{comment:comment,location:location})
                    }else{
                        res.redirect('back')
                    }
                }
            })
        }
    })
})
app.post('/locations/:id/comment',isLoggedIn,function(req,res){
    Location.findById(req.params.id,function(err,location){
        if(err){
            res.redirect('/locations/'+req.params.id)
        }else{
            Comment.create(req.body.comment,function(err,comment){
                if(err){
                    console.log(err)
                }else{
                    comment.Author.id =req.user._id
                    comment.Author.username =  req.user.username
                    comment.save()
                    location.comments.push(comment)
                    location.save()
                    res.redirect('/locations/'+location._id)
                }
            })
        }
    })
})
app.put('/locations/:id',isLoggedIn,function(req,res){
    Location.findOneAndUpdate({_id:req.params.id},req.body,function(err,location){
        if(err){
            console.log(err)
            res.render("edit",{error:req.flash('error', err.message)});
        }else{
            req.flash("success","Successfully Updated!");
            res.redirect('/locations/'+req.params.id)
        }
    })
})
app.put('/locations/:id/comment/:id2/edit',isLoggedIn,function(req,res){
    Location.findOne({_id:req.params.id},function(err,location){
        if(err){
            console.log(err)
            req.flash('error',err.message)
        }else{
            Comment.findOneAndUpdate({_id:req.params.id2},req.body.comment,function(err,location){
                if(err){
                    console.log(err)
                    res.render("commentedit",{error:req.flash('error', err.message)});
                }else{
                    req.flash("success","Successfully Updated!");
                    res.redirect('/locations/'+req.params.id)
                }
            })
        }
    })
})
app.delete('/locations/:id/comment/:id2/delete',isLoggedIn,function(req,res){
    Location.findOne({_id:req.params.id},function(err,location){
        if(err){
            console.log(err)
            req.flash('error',err.message)
        }else{
            Comment.findById(req.params.id2,function(err,comment){
                if(err){
                    console.log(err)
                    req.flash('error', err.message);
                }else{
                    if(comment.Author.id.equals(req.user._id)){
                        Comment.findOneAndRemove({_id:req.params.id2},function(err,location){
                            if(err){
                                console.log(err)
                                req.flash('error', err.message);
                            }else{
                                req.flash('error', 'Campground deleted!');
                                res.redirect('/locations/'+req.params.id)
                            }
                        })
                    }else{
                        res.redirect("back")
                    }
                }
            })    
        }
    })
})
app.delete('/locations/:id/delete',isLoggedIn,function(req,res){
    Location.findById(req.params.id,function(err,location){
        if(err){
            console.log(err)
            req.flash('error', err.message);
        }else{
            if(location.Author.id.equals(req.user._id)){
                Location.findOneAndRemove({_id:req.params.id},function(err,location){
                    if(err){
                        console.log(err)
                        req.flash('error', err.message);
                    }else{
                        req.flash('error', 'Campground deleted!');
                        res.redirect('/locations')
                    }
                })
            }else{
                res.redirect("back")
            }
        }
    })
})
app.post('/locations',isLoggedIn,function(req, res){
    name = req.body.name
    image = req.body.image
    desc = req.body.desc
    const newLocation = {name:name,image:image,desc:desc}
    newLocation.Author ={id:req.user._id,username:req.user.username}
    Location.create(newLocation,function(error,newly){
        if(error){
            console.log("error.....!")
        }
        else{
            res.redirect('/locations')
        }
    })
})

/////////////////////////////
app.listen(process.env.PORT || 5050,process.env.IP,function(req,res){
    console.log("App has been Started")
})
