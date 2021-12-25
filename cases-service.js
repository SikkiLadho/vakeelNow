var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect("mongodb+srv://nagpal:2kEBFWlv7c3tiSHG@cluster0.rbpk1.mongodb.net/vakeelNow?retryWrites=true&w=majority")
.catch(err => console.log("\n\n\nError occured in connection: ", err));


var caseSchema = new Schema({
    "userName":  String,
    "vakeelName": String,
    "caseTitle": String,
    "caseText": String,
    "expertise": String,
    "vakeelResponse": String,
  });




var Case = mongoose.model("cases", caseSchema);



module.exports.initialize = function () {
    return new Promise(function (resolve, reject) 
    {
        let db = mongoose.createConnection("mongodb+srv://nagpal:2kEBFWlv7c3tiSHG@cluster0.rbpk1.mongodb.net/vakeelNow?retryWrites=true&w=majority");
        db.on('error', (err)=>{reject(err);  });
        db.once('open', ()=>{Case = db.model("cases", caseSchema);resolve();

    });
});
};


module.exports.getAll = () => {
    return new Promise(function (resolve, reject) 
    {
    Case.find().lean()
    .exec()
    .then(cases => {
        
        resolve(cases);
    })
    .catch(err => reject(err));
});
}




module.exports.create = (caseData) => {
    return new Promise(function (resolve, reject) 
    {
        caseData.vakeelName = "null"
        caseData.vakeelResponse = "null"
        let newCase = new Case(caseData);
        newCase.save((err)=> {
            if(!err)
                {
                  resolve("Succesfully saved the user object.");
                }
            else if(err.code !=1100){
                reject("There was an error creating the case: " + err);
            }
        })
    })
}


module.exports.getById = (id) => {
    return new Promise(function (resolve, reject) 
    {
        Case.findOne({ _id: id })
        .lean()
        .then( data => {
            resolve(data);
        }

        )
        .catch(err=> reject(err));
    })
}


module.exports.deleteById = (id) => {
    return new Promise(function (resolve, reject) 
    {
        Case.deleteOne({ _id: id })
        .exec()
        .then( data => {
            if(!data)
                reject("Nothing was found.");
            else
                resolve("success");

        }
        )
        .catch(err=> reject(err));
    })
}

module.exports.updateById = (id, vakeelResponse, vakeelName) => {
    return new Promise(function (resolve, reject) 
    {
        Case.updateOne({_id:id}, {vakeelResponse: vakeelResponse, vakeelName: vakeelName })
        .exec()
        .then(data => {
            if(!data)
                reject("nothing was found");
            else    
            {
                console.log("Response update in caseService:", data);
                resolve("success");
            }

        })     
        .catch(err =>  reject(err));
    })
}
