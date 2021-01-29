const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json(), (err, req, res, next) =>{
  res.status(400);
  res.json({
    "message": "Invalid JSON payload passed.",
    "status": "error",
    "data": null
  })
});
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) =>{
  res.status(200);
  res.json({
    "message": "My Rule-Validation API",
    "status": "success",
    "data": {
      "name": "Samuel Ichinga",
      "github": "@Ichinga-Samuel",
      "email": "ichingasamuel@gmail.com",
      "mobile": "09037031782",
      "twitter": "@IchingaSamuel"
    }
  });
});

app.post('/validate-rule', (req, res) =>{

  function validate(payload){
    const msg = {
      "message": "",
      "status": "error",
      "data": null
    };
    const response = {
      "message": "",
      "status": "success",
      "data": {
        "validation": {
          "error": false,
          "field": "",
          "field_value": "",
          "condition": "",
          "condition_value": ""
        }
      },
      response(field, status, error, field_value, condition, condition_value){
        if(error){
          this.message = `field ${field} failed validation.`;
        }
        else{
          this.message = `field ${field} successfully validated.`;
        }
        this.status = status;
        this.data.validation.error = error;
        this.data.validation.field = field;
        this.data.validation.field_value = field_value;
        this.data.validation.condition_value = condition_value;
        this.data.validation.condition = condition;
      }
    };
    let load = payload;
    let ruleField;
    let dataField;
    if(!load.rule){
      msg.message = "rule is required.";
      return {response: msg, statusCode: 400}
    }
    if(!load.data){
      msg.message = "data is required.";
      return {response: msg, statusCode: 400}
    }
    if(typeof load.rule !== 'object'){
      msg.message = "rule should be an object.";
      return {response: msg, statusCode: 400}
    }
    if(!load.rule.condition){
      msg.message = "condition is required.";
      return {response: msg, statusCode: 400}
    }
    let conditions = ['contains', 'eq', 'gte', 'gt', 'neq'];
    if(!conditions.includes(load.rule.condition)){
      msg.message = "condition not valid";
      return {response: msg, statusCode: 400}
    }
    if(!load.rule.condition_value){
      msg.message = "condition_value is required.";
      return {response: msg, statusCode: 400}
    }
    if(typeof load.rule.condition !== 'string'){
      msg.message = "condition should be a string.";
      return {response: msg, statusCode: 400}
    }
    if(!load.rule.field){
      msg.message = "field is required.";
      return {response: msg, statusCode: 400}
    }
    ruleField = load.rule.field;
    let nested = ruleField.includes('.');
    let fields;
    if(nested){
      fields = ruleField.split('.');
      if(!load.data[fields[0]]){
        msg.message = `${fields[0]} is missing from data.`;
        return {response: msg, statusCode: 400}
      }
      if(!load.data[fields[0]][fields[1]]){
        msg.message = `${fields[1]} is missing from data.`;
        return {response: msg, statusCode: 400}
      }
      dataField = load.data[fields[0]][fields[1]]
    }
    if(!nested){
      if(!load.data[ruleField]){
        msg.message = `${ruleField} is missing from data.`;
        return {response: msg, statusCode: 400}
      }
      dataField = load.data[ruleField];
    }
    function setResponse(status, response){
      if(status){
        response.response(ruleField, 'success', !status, dataField, load.rule.condition, load.rule.condition_value);
        return {response: response, statusCode: 200}
      }
      else{
        response.response(ruleField, 'error', !status, dataField, load.rule.condition, load.rule.condition_value);
        return {response: response, statusCode: 400}
      }
    }
    if(load.rule.condition === 'contains' && (Array.isArray(dataField) || typeof dataField === 'string')){
      let status = dataField.includes(load.rule.condition_value);
      return setResponse(status, response)
    }

    else if(load.rule.condition === 'gte' && !Array.isArray(dataField)) {
      let status = dataField >= load.rule.condition_value;
      return setResponse(status, response)
    }
    else if(load.rule.condition === 'eq'){
      let status = dataField === load.rule.condition_value;
      return setResponse(status, response)
    }
    else if(load.rule.condition > 'gt'){
      let status = dataField >= load.rule.condition_value;
      return setResponse(status, response)
    }
    else if(load.rule.condition === 'neq'){
      let status = dataField !== load.rule.condition_value;
      return setResponse(status, response)
    }
    else{
      msg.message = 'Cannot Validate Request.';
      return {response: msg, statusCode: 200}
    }
  }
  let result = validate(req.body);
  res.status(result.statusCode);
  res.json(result.response);
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.listen(process.env.PORT || 3000, () => console.log('App Started'));
module.exports = app;
