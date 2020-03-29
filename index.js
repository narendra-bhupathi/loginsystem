const express = require('express');
const bodyparser = require('body-parser');
var cors = require('cors')
const app = express();

// DataBase
const mongoClient = require('mongodb');
const url ='mongodb://localhost:27017';
app.use(cors());
app.use(bodyparser.json());

// saving the tokens
var cookieParser = require('cookie-parser')
app.use(cookieParser())

//Generating hash Value
const bcrypt = require('bcrypt');
const saltRounds = 10;
//Generating tokens 
const jwt=require('jsonwebtoken')



app.get('/',function(req,res){

mongoClient.connect(url,function(err,client){

    if(err) throw err;
    var db=client.db('fb');
    var userdata=db.collection('users').find().toArray();
    
    userdata.then(function(data){
        client.close();
        res.json(data);
    })
    .catch(function(err){
        client.close();
        res.status(500).json({
            message:'Error'
        });
    });

   
})

});


app.post('/users', function (req, res) {
    console.log(req.body);
    mongoClient.connect(url, (err, client) => {
        if (err) return console.log(err);
        var db = client.db("fb");

       
         var newdata={
            name:req.body.name,
            email:req.body.email,
            address:req.body.address,
        }
        
        bcrypt.genSalt(saltRounds, function(err, salt) {

            if(err) throw err;
            bcrypt.hash(req.body.password,salt,function(err,hash){
                if(err) throw err;
                newdata.password=hash;

                db.collection('users').insertOne(newdata, (err, data) => {
                    if (err) throw err;
                    client.close();
                    res.json({
        
                        message:'data saved'
                    })
                })

            })
                
           
        });


        
    })
})


app.get('/register', function (req, res) {
    console.log(req.body);
    mongoClient.connect(url, (err, client) => {
        if (err) return console.log(err);
        var db = client.db("fb");
        db.collection('users').insertOne( req.body, (err, data) => {
            if (err) throw err;
            client.close();
            res.json({
                message:'data saved'
            })
        })
    })
})


app.post('/login', function (req, res) {
    

    mongoClient.connect(url,function(err,client){

        if(err) throw err;

        var db=client.db('fb');
        db.collection('users').findOne({email:req.body.email},function(err,d){
            if(err) throw err;
            bcrypt.compare(req.body.password,d.password,function(err,result){
                if(result){

                    //jwt token

                    var jwttoken = jwt.sign({ id: d.id }, 'iamsecretkey',{expiresIn:'1d'});
                    console.log(jwttoken);

                    res.cookie('auth',jwttoken);
                    
                   
                    var ntoken = req.cookies.auth;

                    console.log(ntoken);

                    res.json({
                        message:'sucess',
                        token:jwttoken,
                    })
                }
            })
            
        })


    })


})




function authenticate(req,res,next){

// console.log(req.header('Authorization'));


// let token=req.header('Authorization')

var token = req.cookies.auth;

console.log(token);

if(token==undefined){
    res.status(401).json({
        message:'unauthorized'
    })
}
else{

    jwt.verify(token,'iamsecretkey',function(err,decode){
        console.log(decode);
        if(decode!==undefined)
    {
        
        next();
    }
    else{
        res.status(401).json({
            message:'undefined'
        })
    }


    });
    
    
}
 

}

function next(){
    console.log('secured connection')

}

app.get('/dashboard',authenticate,function(req,res){

   
    res.json({

        message:"protected",
    })

})

app.listen(3030, function(){console.log("Listening to PORT 3030")});