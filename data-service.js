const e = require('express');
const { INTEGER } = require('sequelize');
const Sequelize = require('sequelize');
// const fs = require('fs');
// const path = require('path');

var expertisesData = [];
var vakeelsData = [];

var sequelize = new Sequelize('dtlkv7br0hqjn', 'zsotusfufzzatc', '112da11d6fda83246723fe1d0dd1a618507248d917c12efb4ca2ef8a06a71cc8', {
  host: 'ec2-34-204-58-13.compute-1.amazonaws.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});



var Vakeel = sequelize.define('Vakeel', {
  vakeelNum: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userName: Sequelize.STRING,
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
  contact: Sequelize.STRING,
  expertise: Sequelize.STRING
});

var Expertise = sequelize.define('Expertise', {
  expertiseId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  expertiseName: Sequelize.STRING,

});



function getAllVakeels() {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
    Vakeel.findAll().then(function (data) {
      vakeelsData = data;
      if (vakeelsData) {
        // console.log(vakeelsData);
        resolve(vakeelsData );
      }
      else {
        reject("No data.");
      }
    }).catch(error => reject("FindAll Failed:" + error));
  

  }).catch((error) => reject("Sync failed: " + error))})
}


function intialize() {
  return new Promise(function (resolve, reject) {
    sequelize
      .authenticate()
      .then(function () {

        resolve("Successfully Intialized.");
        //console.log('Connection has been established successfully.');
      })
      .catch(function (err) {
        console.log('Unable to connect to the database:', err);
      
        reject(err);
      });

  })

};

function callBack() {


}


function updateVakeel(newvakeel) {
  return new Promise(function (resolve, reject) {
    console.log("updatinggggg", newvakeel);
    
    sequelize.sync().then(function(){
    Vakeel.update({

        vakeelNum:newvakeel.vakeelNum,
        userName: newvakeel.userName,
        firstName:newvakeel.firstName,
        lastName:newvakeel.lastName,
        email:newvakeel.email,
        expertise:newvakeel.expertise,
        contact:newvakeel.contact
      }, {
        where: {vakeelNum: newvakeel.vakeelNum}
      }).then(function () { console.log("successfully updated vakeel"); resolve();})
        .catch(function (error) {
          reject(error);
        })
  }).catch((error) => reject(error))



   })
 }

function addVakeel(newEmpData) {
  return new Promise(function (resolve, reject) {
    //console.log(newEmpData);
    for (const prop in newEmpData) {
      // console.log(`${newEmpData[prop]}`);
      if (newEmpData[prop] == "") {
        newEmpData[prop] = null;
      }
      //console.log(newEmpData[prop])
    }
    sequelize.sync().then(function () {
      Vakeel.create(newEmpData).then(function (data) {
        resolve(callBack);
      })
      .catch(error => reject(error));


  }).catch((error) => reject(error))})


};
//AddExpertise


function addExpertise(newDepData) {
  return new Promise(function (resolve, reject) {
    //console.log(newEmpData);
   for (const prop in newDepData) {
      // console.log(`${newEmpData[prop]}`);
      if (newDepData[prop] == "") {
        newDepData[prop] = null;
      }
      //console.log(newEmpData[prop])
    }

    sequelize.sync().then(function () {
  Expertise.create(newDepData).then(function (data) {
        resolve(callBack);
      })
      .then((error) => reject(error));
  }).catch((error) => reject(error))})
};


function getExpertiseByNum(num) {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
    Expertise.findAll().then(function (data) {      
      expertisesData = data.filter(a => a.expertiseId==num)[0];
        //console.log(expertisesData);
        resolve( expertisesData );
      
    }).catch((error) => reject(error));

  }).catch((error) => reject(error))
})
}


function deleteExpertiseByNum(num) {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
    Expertise.destroy({ where: { expertiseId: num } }).then(function (data) {
      resolve(callBack);
    }).catch((error) => reject(error));

  }).catch((error) => reject(error))})
}



function deleteVakeelByNum(num) {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
    Vakeel.destroy({ where: { vakeelNum: num } }).then(function (data) {
      console.log("vakeel in delete data service", data);
      resolve(callBack);
    }).catch((error) => reject(error));

  }).catch((error) => reject(error))})
}

function updateExpertise(newdep) {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function(){
      console.log("Expertise Data in DataService Update: ", newdep);
      Expertise.update({
        expertiseName: newdep.expertiseName
            }, {
                where: {expertiseId: newdep.expertiseId}
            }).then(()=> resolve())
            .catch((error) => reject(error));
  }).catch((error) => reject(error))
});
}



// function getVakeelsByStatus(statusOp) {
//   return new Promise(function (resolve, reject) {
//     sequelize.sync().then(function () {
//     Vakeel.findAll().then(function (data) {
//       vakeelsData = data.filter(a=> a.status == statusOp)[0];

//         // console.log(vakeelsData);
//         resolve(vakeelsData);
      
//     })
//     .catch((error) => reject(error))
//   }).catch((error) => reject())})
// }

function getVakeelsByExpertise(expertiseNum) {
  reject();
    return new Promise(function (resolve, reject) {
      sequelize.sync().then(function () {
      Vakeel.findAll().then(function (data) {
        
        vakeelsData = data.filter(a=> a.expertise === expertiseNum)[0];

          // console.log(vakeelsData);
          resolve(vakeelsData);
        
        
      })
      .catch(error => reject(error));
    }).catch((error) => reject(error))})
}

// function getVakeelsByManager(managerNum) {
//   return new Promise(function (resolve, reject) {
//     sequelize.sync().then(function () {
//     Vakeel.findAll().then(function (data) {
//       vakeelsData = data.filter(a => a.vakeelManagerNum == managerNum);
//         // console.log(vakeelsData);
//         resolve( vakeelsData );
      
//     })
//     .catch(error => reject(error));
//   }).catch((error) => reject())})
// }

function getVakeelByNum(num) {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
    Vakeel.findAll().then(function (data) {
      vakeelsData = data.filter(a => a.vakeelNum == num)[0];
       // console.log("vakeels data in dataservice: ", vakeelsData);
        resolve(vakeelsData);
     
    })
    .catch(error => reject(error));

  }).catch((error) => reject(error))})
}


// function getAllVakeels(dataE) {
//   if (dataE == null) {
//     reject();
//   }
//   else {
//     return dataE;
//   }
// }

// function getManagers(dataM) {
//   if (dataM == null) {
//     reject();
//   }
//   else {
//     return dataM;
//   }
// }

function getExpertises() {
  return new Promise(function (resolve, reject) {
    sequelize.sync().then(function () {
    Expertise.findAll().then(function (data) {
      expertisesData = data;
        //console.log("expertises inside data service",expertisesData);
        resolve(expertisesData );
     
    })
    .catch((error) => reject(error));
  }
  ).catch((error) => reject(error))

})
}

module.exports = {
  intialize,deleteVakeelByNum, updateExpertise, updateVakeel, addExpertise, getExpertiseByNum, getAllVakeels, deleteExpertiseByNum, getExpertises, addVakeel, getVakeelsByExpertise, getVakeelByNum,
}