var mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

mongoose.connect("mongodb+srv://nagpal:2kEBFWlv7c3tiSHG@cluster0.rbpk1.mongodb.net/vakeelNow?retryWrites=true&w=majority")
.catch(err => console.log("\n\n\nError occured in connection: ", err));

var userSchema = new Schema({
    "userName":  String,
    "password": String,
    "email": String,
    "userType":String,
    "loginHistory": [{
      "dateTime": Date,
      "userAgent": String
    }],
  });


var User = mongoose.model("tbd", userSchema);

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) 
    {
        let db = mongoose.createConnection("mongodb+srv://nagpal:2kEBFWlv7c3tiSHG@cluster0.rbpk1.mongodb.net/vakeelNow?retryWrites=true&w=majority");
        db.on('error', (err)=>{reject(err);  });
        db.once('open', ()=>{User = db.model("users", userSchema);resolve();

    });
});
};



module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) 
    {
        User.find({ userName: userData.userName})
        .exec()
        .then((users) => {
            if(users.lenght < 1 || users[0] == undefined)
            {
                reject("Unable to find user: " + userData.userName);
            
            }
            else
          {  
            console.log("UserData:", users[0]);
            console.log("Userdata Bcrypt:", userData);
              
            bcrypt.compare(userData.password, users[0].password)
            .then((result) => {
                // result=== true if it matches and result=== false if it does not match
                if(result==false)
                {
                    reject("Incorrect Password for user: " + userData.userName);
                }
                else{

                    User.updateOne(
                        { userName: userData.userName},
                        { $set: { loginHistory: {dateTime: (new Date()).toString(), userAgent: userData.userAgent}} }
                      ).exec().then(resolve(users[0])).catch(err => reject("There was an error verifying the user:" + err ));
        

                }
            })
            .catch(err=> {
                reject("Some error occured while comparing the hash"+err);
            })
        
         } 
        })
        .catch("Unable to find user:" + userData.userName);
    })
}


module.exports.registerUser = function (userData) {
    return new Promise(function (resolve, reject) 
    {
        if(userData.userType == 'admin')
        {
            reject("Admins cannot be manually registered. Nice Try.");
        }
        else if(userData.password != userData.password2)
        {
            console.log("userData: ", userData);
            reject("Passwords do not match");
        }
        else
        {
            userData.loginHistory = {dateTime: (new Date()).toString(), userAgent: userData.userAgent}
            delete userData.password2;
            delete userData.userAgent;


            bcrypt.genSalt(10)  // Generate a "salt" using 10 rounds
            .then(salt=>bcrypt.hash(userData.password,salt)) // encrypt the password: "myPassword123"
            .then(hash=>{
                userData.password = hash;
                
            let newUser = new User(userData);
            newUser.save((err) => {
                if(!err)
                {
                  resolve("Succesfully saved the user object.");
                }
                else if(err.code==11000){
                    console.log("Duplicate Username");
                    reject("User Name already taken.");
                }
                else if(err.code !=1100){
                    reject("There was an error creating the user" + err);
                }
            })
            })
            .catch(err=>{console.log("There was an error encrypting the password" + err); // Show any errors that occurred during the process});
            
        })
        }
        
        
    })
}






  