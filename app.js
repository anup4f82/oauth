var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
// var everyauth = require('everyauth');
var session = require('express-session');
var util = require('util');
var usersBySalesforceId = {};
// Promise = everyauth.Promise;
// var nforce = require('nforce');
var jsforce = require('jsforce');

var app = express();

app.use(cookieParser());
app.use(session({secret: 'thingtech'}));

app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

var oauth2 =  new jsforce.OAuth2({
  clientId:'3MVG9xOCXq4ID1uF3rdaftILEtYnYaKfHa0O5.7M0De2yoJhjyqNnjnFQatYfhQOuMrXrdeu7gHpgXlM3LRdO',
  clientSecret:'7244672496272601945',
  redirectUri:'http://localhost:3000/auth/salesforce/callback'
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/', routes);
app.use('/users', users);

// app.use(everyauth.middleware());


app.get('/oauth/auth',function(req,res){
  res.redirect(oauth2.getAuthorizationUrl());
})

app.get('/auth/salesforce/callback',function(req,res){

  var conn = new jsforce.Connection({oauth2: oauth2});
  var code = req.query.code;
  conn.authorize(code, function(err, userInfo) {
    if (err) { return console.error(err); }
      req.session.accessToken = conn.accessToken;
      req.session.instanceUrl = conn.instanceUrl;
      req.session.refreshToken = conn.refreshToken;
      req.session.userid = userInfo.id;
      req.session.orgid = userInfo.organizationId;
      res.redirect('/');
  })
});

app.get('/create', function(req, res) {
    console.log('Accounts');
    // if auth has not been set, redirect to index
    if (!req.session.accessToken || !req.session.instanceUrl) { res.redirect('/'); }
 
    var conn = new jsforce.Connection({
        accessToken: req.session.accessToken,
        instanceUrl: req.session.instanceUrl
    });

conn.sobject("Conn__C").create({ Name : req.session.orgid,Connection__C : 'true' }, function(err, ret) {
  if (err || !ret.success) { return console.error(err, ret); }
    console.log("Created record id : " + ret.id);
    req.session.recordid = ret.id;
    res.redirect('/');
  // ...
});
 
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
