
const express = require('express');
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require('fs');
const exphbs = require("express-handlebars");
const dataServiceAuth = require("./data-service-auth");
const caseService = require("./cases-service");
const clientSessions = require("client-sessions");
const app = express();
const path = require('path');
const router = express.Router();
const dataService = require('./data-service');
const request = require('request');
const { json, response } = require('express');
const { Console } = require('console');
app.use(express.urlencoded({ extended: false }));
const { render, redirect } = require('express/lib/response');
const e = require('express');
app.engine('.hbs', exphbs({
  extname: '.hbs',
  defaultLayout: 'main', layoutsDir: 'views/layouts/',
  helpers: {

    checkFulltime: function (option) {

      if (option.fn(this).replace(/\s+/g, '') == "FullTime")
        return '<label>Status:</label><br />' +
          '<label  class="checkbox-inline">' +
          '<input type="radio" id="statusFT" name="status" checked value="Full Time" /> Full Time' +
          '</label>' +
          '<label class="checkbox-inline">' +
          '<input type="radio" id="statusPT" name="status"  value="Part Time" /> Part Time' +
          '</label>'
      else if (option.fn(this).replace(/\s+/g, '') == "PartTime")
        return '<label>Status:</label><br />' +
          '<label  class="checkbox-inline">' +
          '<input type="radio" id="statusFT" name="status" value="Full Time" /> Full Time' +
          '</label>' +
          '<label class="checkbox-inline">' +
          '<input type="radio" id="statusPT" name="status" checked  value="Part Time" /> Part Time' +
          '</label>'
    },
    navLink: function (url, options) {
      return '<li' +
        ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
        '><a href="' + url + '">' + options.fn(this) + '</a></li>';
    },
    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters")
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    }
  }
}));

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}




function ensureUserLogin(req, res, next) {
  if(!req.session.user)
    res.redirect("/login");
    else if (req.session.user.userType == 'admin' || req.session.user.userType == 'user' ) {
      next();
    }
    else {
    res.render('login', {errorMessage: "Only User can add a case."});
  }
}



function ensureAdminLogin(req, res, next) {
  if(!req.session.user)
    res.redirect("/login");
  else if (req.session.user.userType != 'admin') {
    res.render('login', {errorMessage: "Cannot access admin rights."});
  } else {
    next();
  }

}

function ensureVakeelLogin(req, res, next) {
  if(!req.session.user)
    res.redirect("/login");
  else if (req.session.user.userType == 'admin' || req.session.user.userType == 'vakeel' ) {
    next();
  } else {
    res.render('login', {errorMessage: "Cannot access vakeel rights."});
  }

}

function ensureVakeelData(req, res, next) {
  if(!req.session.user)
    res.redirect("/login");
  else if(req.session.user.userType == 'vakeel' ) 
  {
  dataService.getAllVakeels().then(data => {

    if(data.filter(a => a.userName == req.session.user.userName ).length < 1)
    {
      
      dataService.getExpertises().then((data) => {
  
      res.render('addVakeel',{expertises: data.length>0 ? data : null , userData : {userName: req.session.user.userName, email: req.session.user.email}})
      }
      ).catch((error) => {  res.render('addVakeel')});
    
    }
    else
    {
      next();    }

  })
}
else{
  next();
}
}






app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "week10example_web322", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

app.set('view engine', '.hbs');


app.use(function(req, res, next) {
  res.locals.session = req.session;
  console.log("app.use middleware called: Session data:", req.session);
  next();
});

//var vakeels;


//PORT Number
let HTTP_PORT = process.env.PORT || 5000;



//Require Storage
const storage = multer.diskStorage({
  destination: "./public/images/uploaded",
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});



const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));

//WebPage HTML Files GET
app.use(express.static('public'));

app.use(function (req, res, next) {
  let route = req.baseUrl + req.path;
  app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "")
  next()
})




//authentications API
router.get('/login', (req, res) => {
  res.render('login');
})

router.get('/register', (req, res) => {
  res.render('register');
})

router.post('/register', (req, res) => {
  dataServiceAuth.registerUser(req.body)
  .then(()=> {
    console.log("request Body in register:",req.body.userType.length)
    if(req.body.userType === 'vakeel')
    {
      dataService.getExpertises().then((data) => {

      
      
        console.log("Vakeel Data in server: ", data);
      res.render('addVakeel',{expertises: data.length>0 ? data : null , userData : {userName: req.body.userName, email: req.body.email}})
      }
      ).catch((error) => {  res.render('addVakeel')});
    
    }
    else
      res.render('register',{successMessage: "User created"});
  })
  .catch((err) => {
    res.render('register',{errorMessage: err, username: req.body.userName});
  })

  req.body.userAgent = req.get('User-Agent');
  
})



app.get('/userlogin',(req, res) => {

res.render('userLogin');

});

router.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  dataServiceAuth.checkUser(req.body).then((user) => {
    req.session.user = 
    {
    userName:  user.userName, // authenticated user's userName
    email: user.email,// authenticated user's email
    userType: user.userType,
    admin: user.userType == "admin" ? true : false,
    vakeel: user.userType == "vakeel" ? true : false,
    user: user.userType == "user" ? true : false,
    loginHistory: user.loginHistory
  }
    console.log("Type of admin:", typeof(req.session.user.admin));
    res.redirect('/');
  
  })
  .catch(err => {
    res.render('login', {errorMessage: err, userName: req.body.userName});
  })
})


app.get("/logout", function(req, res) {
  req.session.reset();
  res.redirect("/login");
});

app.get('/userHistory', ensureLogin, function(req, res) {

res.render('userHistory');
});


router.get('/', ensureLogin, function (req, res) {
  res.render('home');
});

router.get('/about', function (req, res) {
  res.render('about')
});

router.get('/vakeel/add',  function (req, res) {
  dataService.getExpertises().then((data) => {

    
    console.log("Vakeel Data in server: ", data);
  res.render('addVakeel',{expertises: data.length>0 ? data : null })
  }
  ).catch((error) => {  res.render('addVakeel')});
});

router.get('/expertise/add', ensureAdminLogin, function (req, res) {
  res.render('addExpertise')
});

router.get('/images/add', ensureLogin, function (req, res) {
  res.render('addImage')
  
});
//WebPage HTML Files POST

app.post("/images/add", ensureLogin, upload.single("imageFile"), (req, res) => {
  res.redirect('/images')
});

app.post("/vakeel/update",ensureVakeelLogin, (req, res) => {
  const formData = req.body;
  console.log("update", formData);
   dataService.updateVakeel(formData)
     .then(function () { res.redirect('/vakeels') })
     .catch(function (error) { console.log("Rejected! Error Occured In Add Vakeel", error); });
});


app.post("/vakeels/add",  (req, res) => {
  const formData = req.body;

  dataService.addVakeel(formData)
    .then(function () { res.redirect('/vakeels') })
    .catch(function () { console.log("Rejected! Error Occured In Add Vakeel"); });
});

//WebPage HTML Files POST

app.get('/images', ensureLogin, function (res, res) {
  fs.readdir(path.join(__dirname + '/public/images/uploaded'), (err, data) => {
    //console.log(typeof (data))
    res.render('images', {
      images: data
    })
  })
});

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}
//WebPage JSON Files
//Get all vakeels
router.get('/vakeels', ensureUserLogin, ensureVakeelData, async function (req, res) {
  const reqQueryObject = req.query;

  if (isEmpty(req.query)) {

    await dataService.getAllVakeels()
      .then(function (data) {
        if(req.session.user.userType === 'vakeel')
        {
          vakeels = data.filter(a => a.userName == req.session.user.userName);
        }
        else
        {
          vakeels = data;
        }
        res.render('vakeels', {
          vakeel: vakeels
        })


       // console.log("server", vakeels);
      })
      .catch(function (error) { console.log("Rejected! Error:" + error); })
   
  }
  
})

router.get('/expertises', ensureAdminLogin,  function (req, res) {
  const reqQueryObject = req.query;

     dataService.getExpertises()
      .then(function (data) {
        // console.log("expertise", data);
        expertises = data;
        console.log("expertises data in server: ", data);
         res.render("expertises", { expertise: data });

      })
      .catch(function () { res.status(500).send("error occurred."); })
    
  
})
app.post("/expertise/update", ensureAdminLogin,  (req, res) => {
  const formData = req.body;
  
  console.log("Expertise Data in server Update: ", formData);
 // console.log("update", formData);
   dataService.updateExpertise(formData)
     .then(function () { res.redirect('/expertises') })
     .catch(function () { console.log("Rejected! Error Occured In Add Vakeel"); });
});

app.post("/expertises/add", ensureAdminLogin,  (req, res) => {
  const formData = req.body;
  dataService.addExpertise(formData)
    .then(function () { res.redirect('/expertises') })
    .catch(function () { console.log("Rejected! Error Occured In Add expertise"); });
});


router.get('/expertises/:id', ensureAdminLogin,  function (req, res) {
  const num = req.params.id;
  dataService.getExpertiseByNum(num)
    .then(function (data) {  res.render("expertise", { expertise: data }); })
    .catch(function () { console.log("Rejected! No Result Found By This Id"); res.status(404).send("Expertise Not Found"); })
});

router.get('/expertise/delete/:id', ensureAdminLogin, function (req, res) {
  const num = req.params.id
  dataService.deleteExpertiseByNum(num)
    .then(function (data) { console.log("deleted Expertise"); res.redirect('/expertises'); })
    .catch(function () { console.log("Rejected! No Result Found By This Id"); res.status(500).send("Unable to Remove Expertise / Expertise not found"); })
});

app.post('/vakeels/search', ensureLogin, (req, res)=> {
  keyword = req.body.keyword;
  searchBy = req.body.filterBy;
  console.log("Keyword:", keyword);
  console.log("SearchBy:", searchBy);
  
  dataService.getAllVakeels().then( data => {

    if(keyword.length != 0)
    {
    if(searchBy == 'firstName')
      data = data.filter(a => a.firstName.toLowerCase().includes(keyword.toLowerCase()) );
    else if(searchBy == 'lastName')
    data = data.filter(a => a.lastName.toLowerCase().includes(keyword.toLowerCase()) );
    else if(searchBy == 'expertise')
    data = data.filter(a => a.expertise.toLowerCase().includes(keyword.toLowerCase()) );
    
    console.log("Data:", data);
    res.render('vakeels', {vakeel: data})

    }
    else
    {
      res.render('vakeels', {vakeel:data});
    }



 
  })

})

router.get('/vakeels/delete/:id', ensureAdminLogin, function (req, res) {
  const num = req.params.id
  dataService.deleteVakeelByNum(num)
    .then(function (data) { console.log("deleted Expertise"); res.redirect('/vakeels'); })
    .catch(function () { console.log("Rejected! No Result Found By This Id"); res.status(500).send("Unable to Remove Vakeel / Vakeel not found"); })
});

// router.get('/vakeels/:status', ensureLogin, function (req, res) {
//   const statusOp = req.params.status
//   dataService.getVakeelsByStatus(statusOp)
//     .then(function (data) { res.render("vakeel", { vakeel: data }); })
//     .catch(function () { console.log("Rejected! No Result Found By This Status"); res.render("vakeel", { message: "no results" }); })
// });




app.get("/vakeels/:vakeelNum", ensureVakeelLogin, (req, res) => {

  if(vakeelNum != req.session.user.userName)
  {
    res.render('login', {errorMessage: "A vakeel cannot edit another vakeel's account."})
  }

  // initialize an empty object to store the values
  let viewData = {};

  dataService.getVakeelByNum(req.params.vakeelNum).then((data) => {
      if (data) {
              viewData.vakeel = data; //store vakeel data in the "viewData" object as "vakeel"
          } 
      else{
              viewData.vakeel = null; // set vakeel to nullifnone were returned
      }
      }).catch(() => {
          viewData.vakeel = null; // set vakeel to null if there was an error 
          }).then(dataService.getExpertises)
          .then((data) => {
              viewData.expertises = data; // store expertise data in the "viewData" object as "expertises"

              // loop through viewData.expertises and once we have found the expertiseId that matches
              // the vakeel's "expertise" value, add a "selected" property to the matching 
              // viewData.expertises object

              for (let i = 0; i < viewData.expertises.length; i++) {
                  if (viewData.expertises[i].expertiseId == viewData.vakeel.expertise) {
                      viewData.expertises[i].selected = true;
                  }
              }
              }).catch(() => {
                  viewData.expertises = []; // set expertises to empty if there was an error
              }).then(() => {
                  if (viewData.vakeel== null) { // if no vakeel -return an error    
                      res.status(404).send("Vakeel Not Found");
                  } else {
                    console.log("Data:", viewData);
                      res.render("vakeel", { viewData: viewData }); // render the "vakeel" view
                      }
                  });
      });


//cases APIs

app.get('/assigncase/:id', ensureVakeelLogin, (req, res) => {
  id = req.params.id;
  res.render('assignCase', {id:id});
})

app.post('/assigncase/:id', ensureVakeelLogin, (req, res) => {
  id = req.params.id;
  vakeelName = req.session.user.userName;
  vakeelResponse = req.body.vakeelResponse;
  caseService.updateById(id, vakeelResponse, vakeelName)
  .then(data => {
    console.log("successfull response updated");
    res.redirect('/cases/list')

  })
  .catch(err =>  res.redirect('/cases/list'))
})



app.get('/cases/add', ensureUserLogin, (req,res) => {
  
  dataService.getExpertises().then(data => {
    res.render('addCase', {expertises: data})
  })
  .catch(err =>
    res.render('addCase', {errorMessage: "in cases:" +err})
  )
})

app.post('/cases/add', ensureUserLogin, (req,res) => {
  newCase = req.body;
console.log("New Case from post:", newCase);
  newCase.vakeelName = null;
  newCase.userName = req.session.user.userName;

  caseService.create(newCase)
  .then(()=>{
    res.redirect('/cases/add')
  })
  .catch(err => res.render('addCase', {errorMessage: "Error occured:"+ err}));
})


app.get('/cases/list', ensureVakeelData, (req, res) => {
    caseService.getAll()
    .then(data => {

     data = data.map(a => {
      if(a.vakeelName == "null")
        a.vakeelName = "Available"
      else
      a.vakeelName = "Reserved"

      delete a.vakeelResponse;
    return a; 
    })

    console.log("cases in list:", data);
      res.render('cases', {cases: data})
    })
}
)

app.get('/cases/own', ensureUserLogin, (req, res) => {
  caseService.getAll()
  .then(data => {

    data = data.filter(a => a.userName == req.session.user.userName)
    
    data = data.map(a => {
      if(a.vakeelName == "null")
     {
        a.vakeelName = "No Vakeel Assigned";
        a.vakeelResponse = "No Response";
     }
        return a; 
    })
    
    console.log("cases in own:", data);
    res.render('yourCases', {cases: data})
  })
})

// app.get('/case/:id', ensureUserLogin, (req, res) => {
//   id = req.params.id;
//   caseService.getById(id)
//   .then(data => {
//       if(data.vakeelName == "null")
//      {
//         data.vakeelName = "";
//         data.vakeelResponse = "";
//      }
    


//     res.render('case', {case: data})
    
//   })


// })

app.get('/case/delete/:id', ensureUserLogin, (req,res)=> {
  caseService.deleteById(req.params.id).then((data) => {
  res.redirect('/cases/own');
})
.catch(err => res.redirect('/cases/own'));
})

app.post('/cases/search', ensureLogin, (req, res)=> {
  keyword = req.body.keyword;
  searchBy = req.body.filterBy;
  
  caseService().getAll().then( data => {

    if(keyword.length != 0)
    {
    if(searchBy == 'caseTitle')
      data = data.filter(a => a.caseTitle.toLowerCase().includes(keyword.toLowerCase()) );
    else if(searchBy == 'caseText')
    data = data.filter(a => a.caseText.toLowerCase().includes(keyword.toLowerCase()) );
    else if(searchBy == 'expertise')
    data = data.filter(a => a.expertise.toLowerCase().includes(keyword.toLowerCase()) );
    
    res.render('cases', {cases: data})

    }
    else
    {
      res.render('cases', {cases:data});
    }
 
  })

})




app.get('/case/:id', ensureUserLogin, (req, res) => {
  let viewData = {};

  caseService.getById(req.params.id).then((data) => {
      if (data) {
            if(data.vakeelName == "null")
            {
              data.vakeelName = "";
              data.vakeelResponse = "";
            }
          
            viewData.case = data; //store case data in the "viewData" object as "case"
          } 
      else{
              viewData.case = null; // set case to nullifnone were returned
      }
      }).catch(() => {
          viewData.case = null; // set case to null if there was an error 
          }).then(dataService.getExpertises)
          .then((data) => {
              viewData.expertises = data; // store expertise data in the "viewData" object as "expertises"

              // loop through viewData.expertises and once we have found the expertiseId that matches
              // the case's "expertise" value, add a "selected" property to the matching 
              // viewData.expertises object

              for (let i = 0; i < viewData.expertises.length; i++) {
                  if (viewData.expertises[i].expertiseName == viewData.case.expertise) {
                      viewData.expertises[i].selected = true;
                  }
              }
              }).catch(() => {
                  viewData.expertises = []; // set expertises to empty if there was an error
              }).then(() => {
                  if (viewData.case== null) { // if no case -return an error    
                      res.status(404).send("case Not Found");
                  } else {
                    console.log("Data:", viewData);
                      res.render("case", { viewData: viewData }); // render the "case" view
                      }
                  });
      });






//Error Handler
router.get('*', function (req, res) {
  res.status(404).send('Page Not Found Error 404', 404);
});


//Getting data-service.js functions 

dataService.intialize()
.then(dataServiceAuth.initialize)
.then(caseService.initialize)
.then(function () {
   app.listen(HTTP_PORT, () => {
     console.log("app listening on:" + HTTP_PORT);
   });
  })
.catch((err) => { console.log("Erorr occured in in initialise. Initialization failed." + err); });



app.use('/', router);
