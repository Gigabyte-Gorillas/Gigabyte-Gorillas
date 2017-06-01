import { MY_IP } from './../myip';


export const deleteDayInit = () => {
  return {
    type: 'DELETE_DAY_INIT'
  }
};

export const deleteDaySuccess = (data) => {
  return {
    type: 'DELETE_DAY_SUCCESS',
    response: data
  }
};

export const deleteDayFail = (err) => {
  return {
    type: 'DELETE_DAY_FAIL',
    response: err
  }
};

export const updateDayInit = () => {
  return {
    type: 'UPDATE_DAY_INIT'
  }
};

export const updateDaySuccess = (data) => {
  return {
    type: 'UPDATE_DAY_SUCCESS',
    response: data
  }
};

export const updateDayFail = (err) => {
  return {
    type: 'UPDATE_DAY_FAIL',
    response: err
  }
};

export const updateDay = (day) => {
  return dispatch => {
    dispatch (updateDayInit());
    console.log('in update day:', day)
    let putData = Object.assign({}, {data: day});

    return fetch(`http://${MY_IP}:8080/api/dates`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putData)
    })
    .then(data => {
      return data.json()
      .then(data => {
        dispatch(updateDaySuccess(data));
      })
    })
    .catch((err)=> dispatch(updateDayFail(err)));
  }
}

export const deleteDay = (day) => {
  return dispatch => {
    dispatch (deleteDayInit());
    console.log('in delete day:', day)
    let deleteData = Object.assign({}, {data: day});

    return fetch(`http://${MY_IP}:8080/api/dates`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deleteData)
    })
    .then(data => {
      return data.json()
      .then(data => {
        dispatch(deleteDaySuccess(data));
      })
    })
    .catch((err)=> dispatch(deleteDayFail(err)));
  }
}