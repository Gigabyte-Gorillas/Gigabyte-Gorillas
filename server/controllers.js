const db = require('./db/db-config.js');
const config = require('./config.js');
const jwt = require('jwt-simple');
const dbHelpers = require('./db/helpers.js');
const uploadS3 = require('./db/s3-config.js');
const Promise = require('bluebird');
const imageRec = require('./imageRec.js')
const moment = require('moment');

// const zlib = require('zlib'); // USE THIS TO COMPRESS?
// const fs = require('fs');

//PROMISIFY DB HELPERS
const createPromise = Promise.promisify(dbHelpers.create);
const retrievePromise = Promise.promisify(dbHelpers.retrieve);
const updatePromise = Promise.promisify(dbHelpers.update);
const deletePromise = Promise.promisify(dbHelpers.delete);
const deleteFriendPromise = Promise.promisify(dbHelpers.deleteFriendRelationship);

exports.retrieve = retrievePromise;
exports.create = createPromise;
exports.update = updatePromise;

const getUserData = (userId) => {
  let resData = {};
  resData['user'] = {};
  return retrievePromise(dbHelpers.query('retrieveUser', userId))
  .then(user => {
    console.log('user0,', user[0])
    for(let prop in user[0]) {
      resData.user[prop] = user[0][prop];
    }
    resData.user.notifications = resData.user.notifications.lastIndexOf(1) !== -1;
    resData.user.private = resData.user.private.lastIndexOf(1) !== -1;

    console.log("getdata resData['user']", resData['user'])
    if(resData['user'].password) delete resData['user'].password;

    //ADDED BELOW TO GET FRIENDS AND ALL OTHER USERS - DUNCAN
    resData['allUsers'] = [];
    resData['friends'] = [];
    return retrievePromise(dbHelpers.query('retrieveAllOtherUsers', userId))
    .then(users => {
      users.forEach((user) => {
        resData['allUsers'].push({
          id: user.id,
          username: user.username,
          tagline: user.tagline,
          photo: user.photo,
          email: user.email,
        })
      });
      return retrievePromise(dbHelpers.query('retrieveFriends', userId))
      .then((friends) => {
        resData['friends'] = friends.map(friend => friend.id_followee);
      //BELOW FOLLOWS THE CODE THAT WAS EXISTING BEFORE - DUNCAN
      return retrievePromise(dbHelpers.query('retrieveUserHabits', userId))
      .then(habits => {
        if(habits.length) {
          habits.forEach(habit => {
            habit.has_pictures = habit.has_pictures.lastIndexOf(1) !== -1;
            habit.private = habit.private.lastIndexOf(1) !== -1;
            habit.dates = [];
          })
          resData['habits'] = habits;
          // DOES THIS WORK FOR WHEN THERE ARE NO DATES PER HABIT?
          datePromises = resData.habits.map(habit => {
            return retrievePromise(dbHelpers.query('retrieveDatesFromHabit', habit.id))
            .then(dates => {
              dates.forEach(day => {
                let { id, date, picture } = day;
                habit.dates.push({ id, date, picture });
                return day;
              })
            })
          })
          return Promise.all(datePromises)
          .then(() => {
            return resData;
          })
        } else {
          console.log('no habits', resData);
          resData['habits'] = [];
          return resData;
        }
      })
      .catch(err => console.log('Error getting user data from DB:', err))
    })
      })
      .catch(err => {
        console.error(err);
      })
    })
    .catch(err => {
      console.error(err);
    })
}

exports.getUserData = getUserData;

// USERS -------------------------------->
exports.getUser = (req, res) => {
  //ADDED THE FIRST IF STATEMENT TO ACCOUNT FOR CLICKING ON ANOTHER
  //USERS PROFILE. LEFT ELSE BLOCK UNCHANGED - DUNCAN
  if (req.params.user) {
    let user = {id: req.params.user};
    getUserData(user.id)
    .then(data => {
      res.status(200).json(data);
    })
  } else {
    // console.log('x-custom?', req.headers['x-custom-header'])
    //
    // console.log('gu req.headers', req.headers['x-custom-header']);
    // console.log('gu req.cookies', req.cookies);
    // let username = req.session.passport.user;
    let token = req.headers['x-custom-header'];
    console.log('in getuser - token', token)
    let user = jwt.decode(token, config.tokenSecret);
    console.log('gu user', user)
    getUserData(user.user.id)
    .then(data => {
      data.token = token;
      res.status(200).json(data);
    })
    .catch(err => console.error('Error getting user data from DB:', err))
  }
}

exports.addUser = (req, res) => {
  let resData = {};
  resData.user = req.body;
  resData.habits = [];

  createPromise(req.body, 'users')
  .then(user => {
    resData.user.id = user.insertId;

    // console.log('adduser return obj', data)
    res.status(201).json(resData);
  })
  .catch(err => console.error('Error adding user to DB:', err))
}


exports.patchUser = (req, res) => {
  console.log("inside patchUser in server side controller function")
  let resData = {};
  let putData = {};
  if(req.body.data.photo) {
    uploadS3(req.body.data.photo, pic => {
      putData.photo = pic.Location;
      updatePromise(putData, 'users', req.body.user.id)
      .then(user => {
        // console.log('User Updated:', user)
        // console.log('resData', resData)
        res.status(201).json(resData);
      })
      .catch(err => console.error('Error updating user in DB:', err))
    })
  } else{
    updatePromise(req.body.data, 'users', req.body.user.id)
    .then(user => {
      // console.log('User Updated:', user)
      // console.log('resData', resData)
      res.status(201).json(resData);
    })
    .catch(err => console.error('Error updating user in DB:', err))
  }
}


// HABITS -------------------------------->
exports.addHabit = (req, res) => {
  console.log('addhabit req.body', req.body)
  let newHabit = Object.assign({}, req.body.data);
  newHabit.id_users = req.body.user.id;
  newHabit.start_date = new Date().toMysqlFormat(); // LATER - ability to set date?

  newHabit.notification = newHabit.notification ? new Date(newHabit.notification).toMysqlFormat() : null;

  let resData = {};
  resData.token = req.body.token;
  resData.user = req.body.user;
  resData.habits = req.body.habits;

  // console.log('add habit newHabit', newHabit)
  createPromise(newHabit, 'habits')
  .then(habit => {
    // console.log('habit after put in', habit);
    newHabit.id = habit.insertId;
    newHabit.dates = [];
    resData.habits.push(newHabit);
    // console.log('resData in addHabit', resData)
    res.status(201).json(resData);
  })
  .catch(err => console.error('Error adding habit to DB:', err))
}

// HASNT BEEN TESTED...
exports.updateHabit = (req, res) => {
  console.log('UPDATE HABIT DATA', req.body.data)
  req.body.data.notification = req.body.data.notification ? new Date(req.body.data.notification).toMysqlFormat() : null;

  updatePromise(req.body.data, 'habits', req.body.data.id)
  .then(habit => {
    // console.log('updated habit:', habit);
    res.status(200).json(habit);
  })
  .catch(err => console.error('Error updating habit in DB:', err))
}

// DATES ---------------------------------->
exports.addDate = (req, res) => {
  console.log('add date req.body.habits', req.body.habits);
  //RESPONSE DATA OBJECT
  let resData = {
    user: req.body.user,
    habits: req.body.habits,
    token: req.body.token,
  };
  // DEAL WITH NO PICTURE INSTANCES?
  let id_users = req.body.user.id;
  let id_habits, habits, date, imageRecData;

  // USE TO GET HABIT INFORMATION FROM HABIT ID SENT IN REQ
  let allHabits = req.body.habits.map((h, idx) => {
    h.index = idx;
    return h;
  })

  // IF HABIT CHOSEN BY USER
  if(req.body.day && req.body.picHabit) {
    date = new Date(req.body.day.date).toMysqlFormat();
    habits = [req.body.picHabit];
  // IF USING IMAGE REC FOR PICTURE TODAY
  } else {
    date = new Date().toMysqlFormat();
    habits = allHabits.filter(h => {

      if(h.dates.length) {
        var today = moment(new Date()).format('YYYY-MM-DD');
        var day = moment(h.dates[h.dates.length-1].date).format('YYYY-MM-DD')
        return (h.dates && h.dates.length && (today != day))
      } else {
        return true
      }
    })
  }
  console.log('habits', habits)

  let newDate = { id_users, date};
  console.log('req body day, habit', req.body.day, req.body.picHabit);
  // DEAL WITH NO PICTURES INSTANCE
  let picture = req.body.data ? req.body.data.data : 'No Photo';
  uploadS3(picture, pic => {
    newDate.picture = pic.Location;
    if(req.body.habits.length && req.body.day && req.body.picHabit) {
      let thisHabit = allHabits.filter(h => h.id === req.body.picHabit.id);
      habits[0].index = thisHabit[0].index;
    }
    if((req.body.day && req.body.picHabit) || habits.length === 1) {
      newDate.id_habits = habits.length ? habits[0].id : req.body.picHabit.id;
      // LATER: if ONLY 1 HABIT, TRAIN CLARIFAI!!!
      console.log('pichabit', req.body.picHabit)
      console.log('habit length 1 or edit - date to insert:', newDate)
      createPromise(newDate, 'dates')
      .then(date => {
        newDate.id = date.insertId;
        /*inserted this line - Duncan*/
        resData['currentDate'] = newDate;
        if(req.body.habits.length) {
          resData.habits[habits[0].index].dates.push(newDate);
          res.status(201).json(resData);
        } else {
          res.status(201).json(newDate);
        }
      })
      .catch(err => console.error('Error adding date to DB:', err))
    } else if(!req.body.day && !req.body.picHabit && habits && habits.length > 1) { // NOT COMPLETE  - STILL NEED TO MATCH TO HABIT AND SET ID
      imageRec(req.body.data.data, habits)
      .then(habit => {
        if(!habit) res.status(409).json('Already marked off habit for the day');
        else {
          newDate.id_habits = habit.id;
          console.log('image rec newdate', newDate);
          createPromise(newDate, 'dates')
          .then(date => {
            newDate.id = date.insertId;
            /*inserted this line - Duncan*/
            resData['currentDate'] = newDate;
            resData.habits[habit.index].dates.push(newDate);
            res.status(201).json(resData);
          })
          .catch(err => console.error('Error adding date to DB:', err))
        }
      })
      .catch(err => console.error('Image Recognition Error:', err))
    }
  })
}

exports.updateDate = (req, res) => {
  console.log('UPDATE DATE DATA', req.body.data)
  let updateData = {

  }
  // Swap if there is a picture there already...
  if(req.body.data.swap) {
    let placeHolder = new Date();
    placeHolder.setDate(placeHolder.getDate() + 3);
    placeHolder = placeHolder.toMysqlFormat();

    updatePromise({date: placeHolder}, 'dates', req.body.data.swap.id)
    .then(date => {
      updatePromise({id_habits: req.body.data.id_habits}, 'dates', req.body.data.id)
      .then(date => {
        updatePromise({date: req.body.data.swap.date, id_habits: req.body.data.swap.id_habits }, 'dates', req.body.data.swap.id)
        .then(date => {
          console.log('updated date:', date);
          res.status(200).json(date);
        })
        .catch(err => console.error('Error updating date in DB (1):', err))
      })
      .catch(err => console.error('Error updating date in DB (2):', err))
    })
    .catch(err => console.error('Error updating date in DB (3):', err))
  } else {
    updatePromise(req.body.data, 'dates', req.body.data.id)
    .then(date => {
      console.log('updated date:', date);
      res.status(200).json(date);
    })
    .catch(err => console.error('Error updating date in DB:', err))
  }
}

exports.deleteDate = (req, res) => {
  console.log('DELETE DATE DATA', req.body.data)

  deletePromise(req.body.data.id, 'dates')
  .then(date => {
    console.log('deleted date:', date);
    res.status(200).json(date);
  })
  .catch(err => console.error('Error deleting date in DB:', err))
}

// FRIENDS -------------------------------------------->

exports.addFriends = (req, res) => {
  let token = req.headers['x-custom-header'];
  let user = jwt.decode(token, config.tokenSecret);
  let id_follower = user.id;
  req.body.data.forEach(id_followee => {
    createPromise({id_follower, id_followee}, 'friends')
    .then((data) => {
      res.status(201).json(data);
    })
    .catch(err => {
      console.error(err);
      res.status(500);
    })
  })
}

exports.deleteFriend = (req, res) => {
  let token = req.headers['x-custom-header'];
  let user = jwt.decode(token, config.tokenSecret);
  let id_follower = user.id;
  let id_followee = req.body.data;
  deleteFriendPromise(id_follower, id_followee)
  .then((data) => {
    res.status(201).json(data);
  })
  .catch(err => {
    console.error(err);
    res.status(500);
  })
};
