import React, { PropTypes } from 'react'
import { StyleSheet, ScrollView, Text } from 'react-native';
import Day from './Day.js';
var moment = require('moment');

const getDates = (startDate, stopDate) => {
  let dates = [];
  let curDate = startDate;
  while (curDate <= stopDate) {
    dates.push([moment(curDate).format('YYYY-MM-DD'),0])
    curDate = moment(curDate).add(1, 'days');
  }
  return dates;
}

const RecentDays = ({dates, allHabits, habitProps, onPressPic, onPressNoPic}) => {
  // TODO: Refactor so not sorting everytime, save it beforehand
  let dateStrings = habitProps.dates.map(d => [moment(d.date).format('YYYY-MM-DD'), d])
  let startDate = new moment(habitProps.start_date);
  let today = new moment();

  let allDates = getDates(startDate, today);

  allDates = allDates.sort((a,b) => new Date(b[0].toString()) - new Date(a[0].toString()) ).map(d=> {
    let justDates = dateStrings.map(d => d[0]);
    let indexDate = justDates.indexOf(d[0].toString());
    let day;
    let pic = true;

    if (indexDate > -1) {
      day = {
        id: dateStrings[indexDate][1].id,
        date: dateStrings[indexDate][1].date,
        picture: dateStrings[indexDate][1].picture,//'https://thumb1.shutterstock.com/display_pic_with_logo/3679397/381480943/stock-photo-motivational-quote-on-glitter-abstract-background-381480943.jpg',
      }
      // return <Day day={day} habitProps={habitProps} onPressItem={onPressItem}/>
    } else {
      day = {
        id: 0,
        date: d[0].toString(),
        picture: 'https://thumb1.shutterstock.com/display_pic_with_logo/162265/276671360/stock-photo-motivational-quote-to-create-future-on-nature-abstract-background-276671360.jpg',
      }
      pic = false
      // return <Day day={day} habitProps={habitProps} onPressItem={onPressItem}/>
    }
    return <Day day={day} allHabits={allHabits} habitProps={habitProps} onPressItem={pic ? onPressPic.bind({}) : onPressNoPic.bind({})}/>
  });

  return(
    <ScrollView horizontal style={styles.recentDaysContainer}>
      {/* {days} */}
      { allDates }
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  recentDaysContainer: {
    flexDirection: 'row',
  }
});

export default RecentDays
